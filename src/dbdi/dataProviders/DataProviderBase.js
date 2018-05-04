import forEach from 'lodash/forEach';
import isEmpty from 'lodash/isEmpty';
import isFunction from 'lodash/isFunction';
import isString from 'lodash/isString';
import isPlainObject from 'lodash/isPlainObject';
import pull from 'lodash/pull';

import { EmptyObject, EmptyArray, waitAsync } from 'src/util';

import {
  getDataIn,
  setDataIn
} from 'src/firebaseUtil/dataUtil';

export const NOT_LOADED = undefined;

export const LoadState = {
  NotLoaded: 0,
  Fetching: 1,
  Loaded: 2
};

/**
 * The amount of time to wait before deleting data + metadata 
 * from cache after unloading (in ms)
 */
const purgeCacheDelayDefault = 60 * 1000;

const fetchFailDelay = 5 * 1000;

// stop trying after a while
const fetchMaxFailCount = 10;

export default class DataProviderBase {
  _listenersByPath = {};
  _queriesByLocalPath = new Map();
  _listenerData = new Map();
  _loadState = {};
  _fetchFails = {};
  _cache = {};


  // #################################################################################################
  // Load state
  // #################################################################################################

  getLoadState(localPath) {
    return this._loadState[localPath] || LoadState.NotLoaded;
  }

  isDataLoaded(localPath) {
    return this._loadState[localPath] === LoadState.Loaded;
  }

  setLoadState(localPath, state) {
    this._loadState[localPath] = state;
  }


  // #################################################################################################
  // Query & Path management
  // #################################################################################################

  getQueryByQueryInput(queryInput) {
    const localPath = this.getLocalPath(queryInput);
    return this.getQueryByLocalPath(localPath);
  }

  getOrCreateQuery(queryInput) {
    return this.getQueryByQueryInput(queryInput) || this._registerQuery(this.getLocalPath(queryInput), queryInput);
  }

  getQueryByLocalPath(localPath) {
    return this._queriesByLocalPath.get(localPath);
  }

  getLocalPath(queryInput) {
    let localPath;
    if (isString(queryInput)) {
      localPath = queryInput;
    }
    else if (isPlainObject(queryInput)) {
      // local path is any unique string representation of the queryInput
      localPath = JSON.stringify(queryInput);
    }
    return localPath;
  }

  getRemotePath(queryInput) {
    let remotePath;
    if (isString(queryInput)) {
      remotePath = queryInput;
    }
    else if (isPlainObject(queryInput)) {
      // remote path is the path part of the query (which can include further arguments)
      remotePath = queryInput.path;
    }
    return remotePath;
  }

  _setQueryCache(query) {
    const {
      //queryInput,
      localPath
    } = query;
    this._queriesByLocalPath.set(localPath, query);
  }

  _registerQuery(localPath, queryInput) {
    let cachedQuery = this.getQueryByLocalPath(localPath);
    if (!cachedQuery) {
      // does not exist yet
      const remotePath = this.getRemotePath(queryInput);

      cachedQuery = {
        queryInput,
        localPath,
        remotePath,
        _useCount: 1
      };
      this._setQueryCache(cachedQuery);
    }
    else {
      ++cachedQuery._useCount;
    }
    return cachedQuery;
  }


  // #################################################################################################
  // Listeners
  // #################################################################################################

  getListeners(localPath) {
    return this._listenersByPath[localPath];
  }

  registerListener(queryInput, listener, who) {
    console.assert(isFunction(listener), '[INTERNAL ERROR] listener must be function.');

    const localPath = this.getLocalPath(queryInput);

    let listeners = this.getListeners(localPath);

    if (!listeners) {
      // first time, anyone is showing interest in this path
      this._listenersByPath[localPath] = listeners = new Set();
    }
    if (!listeners.has(listener)) {
      // add listener to set (if not already listening)
      listeners.add(listener);
      this._listenerData.set(listener, {
        byPath: {}
      });
    }

    if (!this._listenerData.get(listener).byPath[localPath]) {
      // if not already listening on path, register!
      //console.warn(who, '[registerListener]', localPath);

      const query = this._registerQuery(localPath, queryInput);
      const customData = this.onPathListenStart(query, listener);
      this._listenerData.get(listener).byPath[localPath] = {
        query,
        customData
      };
    }
  }

  unregisterListener(listener) {
    const listenerData = this._listenerData.get(listener);
    if (!!listenerData) {
      const byPath = listenerData.byPath;

      // we need to first copy the set of keys, since
      //    we will delete keys from byPath, thereby making an iteration on byPath 
      //    itself cause all kinds of issues...
      forEach(byPath, (pathData, localPath) => this._unregisterListenerPath(localPath, pathData, listener));
    }
  }

  _unregisterListenerPath(localPath, pathData, listener) {
    //console.log('unregister path: ' + localPath);
    const listeners = this.getListeners(localPath);

    const listenerData = this._listenerData.get(listener);

    if (!listenerData) {
      console.error('[INTERNAL ERROR] listener not registered');
      return;
    }

    if (!listeners || !listeners.has(listener)) {
      console.error('[INTERNAL ERROR] listener not registered at path: ' + localPath);
      return;
    }

    setTimeout(() => {
      const byPathData = listenerData.byPath[localPath];
      const {
        query,
        customData
      } = byPathData;


      // delete all kinds of stuff
      delete listenerData.byPath[localPath];

      // reduce queryInputCache useCount
      --query._useCount;

      // if (!query._useCount) {
      //   // this is already handled in _onPathUnused
      // }

      if (isEmpty(listenerData.byPath)) {
        // we removed the last path for listener: delete listener, as well
        listeners.delete(listener);
        this._listenerData.delete(listener);

        if (isEmpty(listeners)) {
          // we removed the last listener at path
          this._onPathUnused(localPath);
        }
      }

      this.onPathListenEnd(query, listener, customData);
    }, purgeCacheDelayDefault);
  }

  _onPathUnused(localPath) {
    console.log('UNLOAD', localPath);
    delete this._listenersByPath[localPath];
    this._queriesByLocalPath.delete(localPath);
    delete this._loadState[localPath];
    if (this._fetchFails[localPath]) {
      delete this._fetchFails[localPath];
    }
  }

  // #################################################################################################
  // Handle data
  // #################################################################################################

  notifyNewData(query, val) {
    const {
      localPath
    } = query || EmptyObject;

    if (val === NOT_LOADED) {
      if (this.isDataLoaded(localPath)) {
        this.setLoadState(localPath, LoadState.NotLoaded);
        console.log('UNLOAD ', localPath, ' -> ', val);
      }
    }
    else if (!this.isDataLoaded(localPath)) {
      this.setLoadState(localPath, LoadState.Loaded);
      console.log('LOADED ', localPath, ' -> ', val);
    }

    //console.warn('DATA [', query.remotePath, '] ', val);

    // update cache
    setDataIn(this._cache, localPath, val);

    // notify all listeners
    const listeners = this.getListeners(localPath) || EmptyArray;

    // listeners will get called once per path
    setTimeout(() => listeners.forEach(listener => listener(query, val)));
    // setTimeout(() => {
    //   for (let i = listeners.length-1; i >= 0; --i) {
    //   for (let i = 0; i < listeners.length; ++i) {
    //     listeners[i](query, val);
    //   }
    // });
  }


  readData(queryInput) {
    const query = this.getQueryByQueryInput(queryInput);
    //console.warn('R [', queryInput, '] ', query, this._loadState[query.localPath]);
    if (!query) {
      return NOT_LOADED;
    }

    const { localPath } = query;
    const val = getDataIn(this._cache, localPath, NOT_LOADED);

    if (val === NOT_LOADED) {
      if (this.isDataLoaded(localPath)) {
        // return null, if it is already loaded
        return null;
      }
    }

    return val;
  }

  // #################################################################################################
  // Fetching
  // #################################################################################################

  /**
   * Determines whether the current state allows for/needs a fetch
   */
  fetchStart(queryInput) {
    const query = this.getQueryByQueryInput(queryInput);
    //console.warn('R [', queryInput, '] ', query, this._loadState[query.localPath]);
    if (!query) {
      return false;
    }

    const { localPath } = query;
    if (this.getLoadState(localPath) !== LoadState.NotLoaded) {
      return false;
    }

    const fetchFailCount = this._fetchFails[localPath];
    if (fetchFailCount >= fetchMaxFailCount) {
      // past the fail limit
      console.error(`exceeded fetch fail limit @${localPath} - stopped trying.`);
      return false;
    }

    // set load state to fetching
    //  (which is technically still "NotLoaded", but we set state to "Fetching", to prevent double fetching)
    this.setLoadState(localPath, LoadState.Fetching);

    // if failed before, delay!
    if (fetchFailCount > 0) {
      console.warn(`previous fetch failed @${localPath} - throttling`);
      return waitAsync(fetchFailDelay).then(() => true);
    }

    return true;
  }

  /**
   * Update state based on fetched result
   */
  fetchEnd(queryInput, val) {
    const query = this.getQueryByQueryInput(queryInput);
    if (!query) return;

    const {
      localPath,
      remotePath
    } = query;

    if (this.getLoadState(localPath) !== LoadState.Fetching) {
      // something happened in the meantime -> discard fetched result
      console.warn('discarding fetched result because path status changed @', localPath, '-', val);
      return;
    }

    // update state
    if (val === NOT_LOADED) {
      this.setLoadState(localPath, LoadState.NotLoaded);
    }
    else {
      this.setLoadState(localPath, LoadState.Loaded);
    }

    // reset failure
    this._fetchFails[localPath] = null;

    // set new state (which should notify all listeners)
    this.actions.set(remotePath, val);
  }

  fetchFailed(queryInput, err) {
    console.error(`Failed to fetch path "${queryInput}" - `, (err && err.stack || err));

    const query = this.getQueryByQueryInput(queryInput);
    if (!query) return;
    const {
      localPath,
      remotePath
    } = query;

    if (this.getLoadState(localPath) !== LoadState.Fetching) {
      // something happened in the meantime -> discard fetched result
      return;
    }

    // remember failure
    this._fetchFails[localPath] = (this._fetchFails[localPath] || 0)+1;

    // downgrade load state at path
    this.setLoadState(localPath, LoadState.NotLoaded);
    this.actions.set(remotePath, NOT_LOADED);
  }

  // #################################################################################################
  // Any DataProvider needs to implement the following methods
  // #################################################################################################

  /**
   * We have at least one listener listening to the localPath in the given query
   */
  onPathListenStart(query, listener) {
    //throw new Error('DataProvider did not implement `onListenerAdd` method');
  }

  /**
   * Not a single soul cares about the localPath in the given query anymore
   */
  onPathListenEnd(query, listener, customData) {
    //throw new Error('DataProvider did not implement `onListenerRemove` method');
  }

  actions = {
    set: (remotePath, val) => {
      throw new Error('DataProvider did not implement `set` action');
    },

    push: (remotePath, val) => {
      throw new Error('DataProvider did not implement `push` action');
    },

    update: (remotePath, val) => {
      throw new Error('DataProvider did not implement `update` action');
    },

    delete: (remotePath) => {
      throw new Error('DataProvider did not implement `delete` action');
    },

    // transaction: () => {
    // },

    // batchUpdate: () => {
    // }
  }
}

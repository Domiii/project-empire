import forEach from 'lodash/forEach';
import isEmpty from 'lodash/isEmpty';
import isFunction from 'lodash/isFunction';
import isString from 'lodash/isString';
import isPlainObject from 'lodash/isPlainObject';
import pull from 'lodash/pull';

import { EmptyObject, EmptyArray } from 'src/util';



/**
 * The amount of time to wait before deleting data + metadata 
 * from cache after unloading (in ms)
 */
const purgeCacheDelayDefault = 60 * 1000;

export default class DataProviderBase {
  _listenersByPath = {};
  _queriesByLocalPath = new Map();
  _listenerData = new Map();

  getListeners(path) {
    return this._listenersByPath[path];
  }

  getQueryByQueryInput(queryInput) {
    const localPath = this.getLocalPath(queryInput);
    return this.getQueryByLocalPath(localPath);
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

  _useQueryInput(localPath, queryInput) {
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

      const query = this._useQueryInput(localPath, queryInput);
      const customData = this.onListenerAdd(query, listener);
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
      if (!query._useCount) {
        // delete it
        this._queriesByLocalPath.delete(query.localPath);
      }

      if (isEmpty(listenerData.byPath)) {
        // we removed the last path for listener: delete listener, as well
        listeners.delete(listener);
        this._listenerData.delete(listener);

        if (isEmpty(listeners)) {
          // we removed the last listener at path
          delete this._listenersByPath[localPath];
        }
      }

      this.onListenerRemove(query, listener, customData);
    }, purgeCacheDelayDefault);
  }

  // #################################################################
  // Any DataProvider needs to implement the following methods
  // #################################################################

  onListenerAdd(query, listener) {
    //throw new Error('DataProvider did not implement `onListenerAdd` method');
  }

  onListenerRemove(query, listener) {
    //throw new Error('DataProvider did not implement `onListenerRemove` method');
  }

  notifyNewData(query, val) {
    const {
      localPath,
      queryInput
    } = query;

    const listeners = this.getListeners(localPath) || EmptyArray;
    setTimeout(() => listeners.forEach(listener => listener(localPath, queryInput, val)));
  }

  readData(queryInput) {
    throw new Error('DataSource did not implement `readData` method');
  }
}

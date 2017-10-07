import forEach from 'lodash/forEach';
import isEmpty from 'lodash/isEmpty';
import isFunction from 'lodash/isFunction';
import isString from 'lodash/isString';
import isPlainObject from 'lodash/isPlainObject';
import pull from 'lodash/pull';

import { EmptyObject, EmptyArray } from 'src/util';


export default class DataProviderBase {
  _listenersByPath = {};
  _queriesByQueryInput = new Map();
  _queriesByLocalPath = new Map();
  _listenerData = new Map();

  getListeners(path) {
    return this._listenersByPath[path];
  }

  getQueryByQueryInput(queryInput) {
    return this._queriesByQueryInput.get(queryInput);
  }

  getQueryByLocalPath(localPath) {
    return this._queriesByLocalPath.get(localPath);
  }

  _getOrCreateQueryInputCache(queryInput) {
    const cache = this._queriesByQueryInput.get(queryInput);
    if (!cache) {
      // does not exist yet
      let localPath, remotePath, remoteQuery;
      if (isString(queryInput)) {
        localPath = remoteQuery = remotePath = queryInput;
      }
      else if (isPlainObject(queryInput)) {
        localPath = JSON.stringify(queryInput);
        remoteQuery = queryInput;
        remotePath = queryInput.path;
      }

      const cache = {
        queryInput,
        localPath,
        remotePath,
        remoteQuery,
        _useCount: 1
      };
      this._queriesByQueryInput.set(queryInput, cache);
      this._queriesByLocalPath.set(localPath, cache);
    }
    else {
      ++cache._useCount;
    }
    return cache;
  }

  registerListener(queryInput, listener) {
    console.assert(isFunction(listener), '[INTERNAL ERROR] listener must be function.');

    const query = this._getOrCreateQueryInputCache(queryInput);
    const {
      localPath
    } = query;

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
      // register new listener for this path (if not already listening on path)
      console.warn('registered path: ', localPath);
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
    console.log('unregister path: ' + localPath);

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
      delete this._queriesByLocalPath[query.localPath];
      delete this._queriesByQueryInput[query.queryInput];
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
      remoteQuery
    } = query;

    const listeners = this.getListeners(localPath) || EmptyArray;
    setTimeout(() => listeners.forEach(listener => listener(localPath, remoteQuery, val)));
  }

  readData(queryInput) {
    throw new Error('DataSource did not implement `readData` method');
  }
}

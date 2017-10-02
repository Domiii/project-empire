import forEach from 'lodash/forEach';
import isFunction from 'lodash/isFunction';
import isEmpty from 'lodash/isEmpty';

import { EmptyObject, EmptyArray } from 'src/util';


export default class DataProviderBase {
  listenersByPath = {};
  listenerData = new Map();

  getListeners(path) {
    return this.listenersByPath[path];
  }

  registerListener(path, listener) {
    console.assert(isFunction(listener), '[INTERNAL ERROR] listener must be function.');

    let listeners = this.getListeners(path);

    if (!listeners) {
      // first time, anyone is showing interest in this path
      this.listenersByPath[path] = listeners = new Set();
    }
    if (!listeners.has(listener)) {
      // add listener to set (if not already listening)
      listeners.add(listener);
      this.listenerData.set(listener, {
        byPath: {}
      });
    }

    if (!this.listenerData.get(listener).byPath[path]) {
      // register new listener for this path (if not already listening on path)
      console.warn('registered path: ', path);
      const customData = this.onListenerAdd(path, listener);
      this.listenerData.get(listener).byPath[path] = {
        customData
      };
    }
  }

  unregisterListener(listener) {
    const listenerData = this.listenerData.get(listener);
    if (!!listenerData) {
      const byPath = listenerData.byPath;

      // we need to first copy the set of keys, since
      //    we will delete keys from byPath, thereby making an iteration on byPath 
      //    itself cause all kinds of issues...
      const paths = Object.keys(byPath);
      forEach(paths, (path) => this.unregisterListenerPath(path, listener));
    }
  }

  unregisterListenerPath(path, listener) {
    console.log('unregister path: ' + path);

    const listeners = this.getListeners(path);

    const listenerData = this.listenerData.get(listener);
    
    if (!listenerData) {
      console.error('[INTERNAL ERROR] listener not registered');
      return;
    }

    if (!listeners || !listeners.has(listener)) {
      console.error('[INTERNAL ERROR] listener not registered at path: ' + path);
      return;
    }

    const byPathData = listenerData.byPath[path];

    // delete all kinds of stuff
    delete listenerData.byPath[path];
    delete this.listenersByPath[path];
    if (isEmpty(listenerData.byPath)) {
      // we removed the last path for listener
      listeners.delete(listener);
      this.listenerData.delete(listener);
    }

    this.onListenerRemove(path, listener, byPathData && byPathData.customData);
  }

  // Any DataSource needs to implement the following three methods:

  onListenerAdd(path, listener) {
    //throw new Error('DataSource did not implement `onListenerAdd` method');
  }

  onListenerRemove(path, listener) {
    //throw new Error('DataSource did not implement `onListenerRemove` method');
  }

  notifyNewData(path, val) {
    const listeners = this.getListeners(path) || EmptyArray;
    setTimeout(() => listeners.forEach(listener => listener(path, val)));
  }

  readData(path) {
    throw new Error('DataSource did not implement `readData` method');
  }
}

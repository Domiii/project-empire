import forEach from 'lodash/forEach';

import { EmptyObject, EmptyArray } from 'src/util';


export default class DataProviderBase {
  listenersByPath = {};
  listenerData = new Map();

  getListeners(path) {
    return this.listenersByPath[path];
  }

  registerListener(path, listener) {
    console.assert(!!listener.onNewData, '[INTERNAL ERROR] listener has no `onNewData` callback.');

    let listeners = this.getListeners(path);

    if (!listeners) {
      // first time, anyone is showing interest in this path
      this.listenersByPath[path] = listeners = new Set();
    }
    if (!listeners.has(listener)) {
      // add listener to set
      listeners.add(listener);
      this.listenerData[listener] = {
        byPath: {}
      };
    }

    if (!this.listenerData[listener].byPath[path]) {
      // register new listener for this path
      console.warn('registered path: ', path);
      const customData = this.onListenerAdd(path, listener);
      this.listenerData[listener].byPath[path] = {
        customData
      };
    }
  }

  unregisterListener(listener) {
    const listenerData = this.listenerData[listener];
    if (!!listenerData) {
      const byPath = listenerData.byPath;
      forEach(byPath, (_, path) => this.unregisterListenerPath(path, listener));
    }
  }

  unregisterListenerPath(path, listener) {
    console.log('unregister path: ' + path);

    const listeners = this.getListeners(path);
    console.assert(listeners, '[INTERNAL ERROR] listener not registered at path: ' + path);

    listeners.delete(listener);
    this.listenerData.delete(listener);

    this.onListenerRemove(path, listener);
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
    setTimeout(() => listeners.forEach(listener => listener.onNewData(path, val)));
  }

  getData(path) {
    throw new Error('DataSource did not implement `getData` method');
  }
}

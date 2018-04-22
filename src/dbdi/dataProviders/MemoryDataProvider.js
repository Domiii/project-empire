/**
 * Read/write data to/from memory
 */

import DataProviderBase from '../dataProviders/DataProviderBase';

import isString from 'lodash/isString';
import map from 'lodash/map';
import isPlainObject from 'lodash/isPlainObject';

import autoBind from 'src/util/auto-bind';

import {
  getDataIn,
  setDataIn
} from 'src/firebaseUtil/dataUtil';

export default class MemoryDataProvider extends DataProviderBase {
  cache = [];

  constructor() {
    super();

    autoBind(this);
  }

  getOrCreateNode(path) {
    let node = getDataIn(root, path);
    if (!node) {
      // in order to mirror firebase' push operation, all nodes are arrays
      // also: make sure, the first element is not an issue
      setDataIn(root, path, node = [null]);
    }
    return node;
  }

  // #################################################################
  // Any DataProvider can/needs to implement the following methods
  // #################################################################

  onListenerAdd(query, listener) {

  }

  onListenerRemove(query, listener) {

  }

  readData(queryInput) {
    const query = this.getQueryByQueryInput(queryInput);
    if (!query) {
      return undefined;
    }

    return getDataIn(this.cache, query.localPath, null);
  }

  _onWrite(action, remotePath, val) {
    // console.log('W [', action, remotePath, '] ', val);

    // local and remote path are equal for the MemoryDataProvider (for now)
    const localPath = remotePath;
    const query = this.getQueryByLocalPath(localPath);

    // if query object does not exist, it means, no listener has been registered on this path yet
    query && this.notifyNewData(query, val);
    return true;
  }

  actions = {
    set: (remotePath, val) => {
      this.getOrCreateNode(remotePath);
      const promise = Promise.resolve(setDataIn(this.cache, remotePath, val));
      this._onWrite('Set', remotePath, val);
      return promise;
    },

    push: (remotePath, val) => {
      throw new Error('TODO: pushing to MemoryDataProvider is currently bugged - still need to fix it. Recommendation: Use a combination of get + set to work around this for now.');

      // let node = this.getOrCreateNode(remotePath);
      // debugger;
      // node.push(val);

      // const key = node.length - 1;
      // const result = key;
      // const promise = Promise.resolve(result);
      // promise.key = key;
      // this._onWrite('Pus', remotePath, val);
      // return promise;
    },

    update: (remotePath, val) => {
      let node = this.getOrCreateNode(remotePath);
      const promise = Promise.all(map(val, (v, k) => setDataIn(node, k, v)));
      this._onWrite('Upd', remotePath, val);
      return promise;
    },

    delete: (remotePath) => {
      let node = getDataIn(this.cache, remotePath);
      let promise;
      if (node !== undefined) {
        promise = Promise.resolve(setDataIn(this.cache, remotePath, undefined));
      }
      else {
        return Promise.resolve();
      }
      this._onWrite('Del', remotePath);
      return promise;
    },

    // transaction: () => {
    //   // TODO
    // },

    // batchUpdate: () => {
    //   // TODO
    // }
  }
}
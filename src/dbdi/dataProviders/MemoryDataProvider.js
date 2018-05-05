/**
 * Read/write data to/from memory
 */

import DataProviderBase, { NOT_LOADED } from '../dataProviders/DataProviderBase';

import { pathJoin } from 'src/util/pathUtil';

import isString from 'lodash/isString';
import map from 'lodash/map';
import isPlainObject from 'lodash/isPlainObject';

import autoBind from 'src/util/auto-bind';

import {
  getDataIn,
  setDataIn
} from '../PathUtil';

export default class MemoryDataProvider extends DataProviderBase {
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

  onPathListenStart(query, listener) {

  }

  onPathListenEnd(query, listener, customData) {

  }

  _onWrite(action, remotePath, val) {
    // console.log('W [', action, remotePath, '] ', val);

    // local and remote path are equal for the MemoryDataProvider (for now)
    const query = this.getOrCreateQuery(remotePath);

    // if query object does not exist, it means, no listener has been registered on this path yet

    // TOOD: propagate to all ancestors that have listeners (Firebase does this, too)
    this.notifyNewData(query, val);
    return true;
  }

  actions = {
    set: (remotePath, val) => {
      this._onWrite('Set', remotePath, val);
      return Promise.resolve(true);
    },

    push: (remotePath, val) => {
      throw new Error('TODO: pushing to MemoryDataProvider is currently bugged - still need to fix it. HINT: Use a combination of get + set to work around this for now.');

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
      map(val, (v, k) => this._onWrite('Upd', pathJoin(remotePath, k), v));
      return Promise.resolve(true);
    },

    delete: (remotePath) => {
      const data = this.readData(remotePath);
      if (data !== null) {
        // deleted it
        this._onWrite('Del', remotePath, null);
        return Promise.resolve(true);
      }
      else {
        // nothing to do
        return Promise.resolve(false);
      }
    },

    // transaction: () => {
    //   // TODO
    // },

    // batchUpdate: () => {
    //   // TODO
    // }
  }
}
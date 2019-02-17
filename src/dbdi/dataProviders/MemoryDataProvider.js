/**
 * Read/write data to/from memory
 */

import DataProviderBase, { NOT_LOADED } from '../dataProviders/DataProviderBase';

import { pathJoin } from 'src/util/pathUtil';

import isString from 'lodash/isString';
import map from 'lodash/map';
import isPlainObject from 'lodash/isPlainObject';

import autoBind from 'src/util/auto-bind';
import uuid from 'uuid/v1';

import {
  getDataIn,
  setDataIn,
  getAllAncestorNodesInPath
} from '../PathUtil';

export default class MemoryDataProvider extends DataProviderBase {
  constructor() {
    super();

    autoBind(this);
  }

  /**
   * TODO: Memory data provider might be used for different purposes.
   *  e.g.: fetchGood vs. 
   * When acting as a cache for a remote API, isDataFullyAvailable 
   * behaves like it would for a remote DataProvider.
   * When just storing some local values, this should just return true.
   * Path configuration should decide!
   */
  // isDataFullyAvailable() {
  //   return true;
  // }

  // #################################################################
  // Any DataProvider can/needs to implement the following methods
  // #################################################################

  async fetchOnce() {
    return null;
  }

  /**
   * A listener started listening on a path for the fast time
   */
  onPathListenStart(query, listener) {

  }

  onPathListenEnd(query, customData) {

  }

  _onWrite(action, remotePath, val) {
    console.log('W [', action, remotePath, '] ', val);

    // NOTE: local and remote path are equal for the MemoryDataProvider (for now)
    const query = this.getOrCreateQuery(remotePath);
    this.notifyNewData(query, val);

    // TODO: untested

    // propagate to all ancestors that have listeners (Firebase does this, too)
    for (let path of getAllAncestorNodesInPath(remotePath)) {
      const query = this.getOrCreateQuery(path);
      const { localPath } = query;
      const val = getDataIn(this._cache, localPath);
      this.notifyNewData(query, val);
    }
    
    return true;
  }

  actions = {
    set: (remotePath, val) => {
      this._onWrite('Set', remotePath, val);
      return Promise.resolve(true);
    },

    /**
     * (somewhat) mimics Firebase push behavior
     * @see https://firebase.google.com/docs/reference/js/firebase.database.Reference#push
     */
    push: (remotePath, val) => {
      const key = uuid();
      const promise = Promise.resolve(true);
      promise.key = key;
      //console.log('push', pathJoin(remotePath, key), val);
      this._onWrite('Pus', pathJoin(remotePath, key), val);
      return promise;
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
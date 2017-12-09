import firebase from 'firebase';

import {
  applyParamsToQuery,
  applyQueryToDataSet
} from './firebase-util';

import DataProviderBase from '../DataProviderBase';

import isString from 'lodash/isString';
import isPlainObject from 'lodash/isPlainObject';

import autoBind from 'src/util/auto-bind';

import {
  getDataIn,
  setDataIn
} from 'src/firebaseUtil/dataUtil';


/**
 * TODO: advanced features:
 *  updatedAt
 *  implicit (one-to-one + one-to-many) indices
 *  explicit (many-to-many) indices
 *  groupBy
 */

export default class FirebaseDataProvider extends DataProviderBase {
  _database;
  firebaseCache = {};
  loadedPaths = {};

  constructor(app) {
    super();

    if (app) {
      this._database = firebase.database(app);
    }

    autoBind(this);
  }

  database() {
    if (!this._database) {
      this._database = firebase.database();
    }
    return this._database;
  }

  // ################################################
  // Private properties + methods
  // ################################################

  _onNewData(query, snap) {
    const val = snap.val();
    this.loadedPaths[query.localPath] = 1;
    //console.log('R [', query.remotePath, '] ', val);

    if (val !== undefined && val !== null) {
      setDataIn(this.firebaseCache, query.localPath, val);
    }

    this.notifyNewData(query, val);
  }

  _onError(err) {
    console.error(`[${this.constructor.name}] ${err.stack}`);
  }

  _getRef(query) {
    const {
      remotePath,
      queryInput: {
        queryParams
      }
    } = query;
    let ref = this.database().ref().child(remotePath);
    if (queryParams) {
      ref = applyParamsToQuery(queryParams, ref);
    }
    return ref;
  }

  // ################################################
  // Public properties + methods
  // ################################################

  onListenerAdd(query, listener) {
    const hook = snap => this._onNewData(query, snap);

    const ref = this._getRef(query);
    ref.on('value',
      hook,
      this._onError);
    return hook;
  }

  onListenerRemove(query, listener, hook) {
    const ref = this._getRef(query);
    ref.off('value', hook);
    if (!query._useCount) {
      // set path as unloaded
      delete this.loadedPaths[query.localPath];
    }
  }

  isDataLoaded(queryInput) {
    const query = this.getQueryByQueryInput(queryInput);
    if (!query) {
      return undefined;
    }

    return !!this.loadedPaths[query.localPath];
  }

  readData(queryInput) {
    const query = this.getQueryByQueryInput(queryInput);
    if (!query) {
      return undefined;
    }

    if (!this.loadedPaths[query.localPath]) {
      return undefined;
    }

    let allData = getDataIn(this.firebaseCache, query.localPath, null);

    // should not be necessary, since we already subscribed to only this subset of data anyway!

    // if (allData) {
    //   allData = applyQueryToDataSet(allData, queryParams);
    // }
    return allData;
  }

  _onWrite(action, remotePath, val) {
    console.log('W [', action, remotePath, '] ', val);
    return true;
  }

  actions = {
    set: (remotePath, val) => {
      this._onWrite('Set', remotePath, val);
      let ref = this.database().ref().child(remotePath);
      return ref.set(val);
    },

    push: (remotePath, val) => {
      this._onWrite('Pus', remotePath, val);
      let ref = this.database().ref().child(remotePath);
      return ref.push(val);
    },

    update: (remotePath, val) => {
      this._onWrite('Upd', remotePath, val);
      let ref = this.database().ref().child(remotePath);
      return ref.update(val);
    },

    delete: (remotePath) => {
      this._onWrite('Del', remotePath);
      let ref = this.database().ref().child(remotePath);
      return ref.set(null);
    },

    transaction: () => {
      // TODO
    },

    batchUpdate: () => {
      // TODO
    }
  }
}


export class FirebaseAuthProvider extends DataProviderBase {
  _auth;
  firebaseAuthData = undefined;

  constructor(app) {
    super();

    if (app) {
      this._auth = firebase.auth(app);
    }

    autoBind(this);
  }

  auth() {
    if (!this._auth) {
      this._auth = firebase.auth();
    }
    return this._auth;
  }

  onListenerAdd(query, listener) {
    // add listener once the first request comes in
    this.auth().onAuthStateChanged((user) => {
      if (user) {
        // User is signed in.
        this.firebaseAuthData = user;
      }
      else {
        // No user is signed in.
        this.firebaseAuthData = null;
      }

      this.notifyNewData(query, user);
    });
  }

  _onError(err) {
    console.error(`[${this.constructor.name}] ${err.stack}`);
  }

  isDataLoaded(queryInput) {
    return this.firebaseAuthData !== undefined;
  }

  readData(queryInput) {
    const query = this.getQueryByQueryInput(queryInput);
    if (!query) {
      return undefined;
    }

    return getDataIn(this.firebaseAuthData, query.localPath, undefined);
  }
}


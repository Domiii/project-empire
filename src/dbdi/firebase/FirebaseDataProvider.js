import firebase from 'firebase';

import {
  applyParamsToQuery,
  applyQueryToDataSet
} from './firebase-util';

import DataProviderBase, { NOT_LOADED } from '../dataProviders/DataProviderBase';

import isString from 'lodash/isString';
import isPlainObject from 'lodash/isPlainObject';

import autoBind from 'src/util/auto-bind';

import {
  getDataIn,
  //setDataIn
} from '../PathUtil';


/**
 * TODO: advanced features:
 *  implicit (one-to-one + one-to-many) indices
 *  explicit (many-to-many) indices
 *  groupBy
 */

/**
 * The FirebaseDataProvider allows 
 */
export default class FirebaseDataProvider extends DataProviderBase {
  _database;

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
    let val = snap.val();
    if (val === NOT_LOADED) {
      // this path is loaded -> make sure, it does not get a NOT_LOADED value
      val = null;
    }

    //console.log('onNewData', query.remotePath, val);
    this.notifyNewData(query, val);
  }

  _onError(err) {
    console.error(`[${this.constructor.name}] ${err.stack}`);
  }

  _getRefByQuery(query) {
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


  async fetchOnce(queryInput) {
    const q = this.justGimmeAQuery(queryInput);
    const ref = this._getRefByQuery(q);
    const snap = await ref.once('value');
    return snap.val();
  }

  /**
   * A listener started listening on a path for the fast time
   */
  onPathListenStart(query, firstListener) {
    const hook = snap => this._onNewData(query, snap);

    const ref = this._getRefByQuery(query);
    ref.on('value',
      hook,
      this._onError);
    return hook;
  }

  /**
   * Not a single soul cares about the localPath in the given query anymore
   */
  onPathListenEnd(query, hook) {
    const ref = this._getRefByQuery(query);
    ref.off('value', hook);
  }

  /**
   * The way the Firebase library (currently) works is that
   * setting something will trigger events on any `child` listeners at the given path.
   * That is why we don't need to explicitely trigger anything during write operations.
   */
  _onWrite(action, remotePath, val) {
    console.log('W [', action, remotePath, '] ', val);
    const query = this.getQuery(remotePath);
    if (query) {
      // send a notification early
      //  because it can save us the time of a round-trip to the database (which is when on('value') fires)
      this.notifyNewData(query, val);
    }
    return true;
  }

  _getRefByPath(remotePath) {
    const ref = this.database().ref().child(remotePath);
    return ref;
  }

  actions = {
    set: (remotePath, val) => {
      let ref = this._getRefByPath(remotePath);
      return ref.set(val) && this._onWrite('Set', remotePath, val);
    },

    push: (remotePath, val) => {
      let ref = this._getRefByPath(remotePath);
      return ref.push(val) && this._onWrite('Pus', remotePath, val);
    },

    update: (remotePath, val) => {
      let ref = this.database().ref().child(remotePath);
      return ref.update(val) && this._onWrite('Upd', remotePath, val);
    },

    delete: (remotePath) => {
      let ref = this.database().ref().child(remotePath);
      return ref.set(null) && this._onWrite('Del', remotePath);
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

  onPathListenStart(query, listener) {
    // add listener once the first request comes in
    this.auth().onAuthStateChanged((user) => {
      this.notifyNewData(this.getOrCreateQuery(''), user || null);
      this.notifyNewData(query, user && getDataIn(user, query.remotePath, null) || user);
    });
  }

  _onError(err) {
    console.error(`[${this.constructor.name}] ${err.stack}`);
  }
}


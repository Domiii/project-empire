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


export default class FirebaseDataProvider extends DataProviderBase {
  database;
  firebaseCache = {};

  constructor(app) {
    super();

    this.database = firebase.database(app);

    autoBind(this);
  }
  
  // ################################################
  // Private properties + methods
  // ################################################

  _onNewData(query, snap) {
    const val = snap.val();
    console.log('R [', query.remotePath, '] ', val);
    setDataIn(this.firebaseCache, query.localPath, val);

    this.notifyNewData(query, val);
  }

  _onError(err) {
    console.error(`[${this.constructor.name}] ${err.stack}`);
  }

  _getRef(query) {
    const {
      remotePath,
      queryParams
    } = query;
    let ref = this.database.ref().child(remotePath);
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
  }

  isDataLoaded(queryInput) {
    return this.readData(queryInput) !== undefined;
  }

  readData(queryInput) {
    const query = this.getQueryByQueryInput(queryInput);
    if (!query) {
      return undefined;
    }

    let allData = getDataIn(this.firebaseCache, query.localPath, undefined);
    
    // should not be necessary, since we already subscribed to only this subset of data anyway!

    // if (allData) {
    //   allData = applyQueryToDataSet(allData, queryParams);
    // }
    return allData;
  }
}


export class FirebaseAuthProvider extends DataProviderBase {
  auth;
  firebaseAuthData = undefined;

  constructor(app) {
    super();

    this.auth = firebase.auth(app);

    autoBind(this);
  }

  onListenerAdd(query, listener) {
    // add listener once the first request comes in
    this.auth.onAuthStateChanged((user) => {
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

    return getDataIn(this.firebaseCache, query.localPath, undefined);
  }
}
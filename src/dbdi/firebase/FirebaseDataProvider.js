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
  firebaseCache = {};

  constructor() {
    super();

    autoBind(this);
  }

  _onNewData(path, query, snap) {
    const val = snap.val();
    //console.log('R [', path, '] ', val);
    setDataIn(this.firebaseCache, path, val);

    this.notifyNewData(path, val);
  }

  _onError(err) {
    console.error(`[${this.constructor.name}] ${err.stack}`);
  }

  onListenerAdd(path, query, listener) {
    const hook = snap => this._onNewData(path, query, snap);
    const { queryParams } = query;
    let ref = firebase.database().ref().child(path);
    if (queryParams) {
      ref = applyParamsToQuery(queryParams, query);
    }

    ref.on('value',
      hook,
      this._onError);
    return hook;
  }

  onListenerRemove(path, listener, hook) {
    firebase.database().ref(path).off('value', hook);
  }

  isDataLoaded(path) {
    return this.readData(path) !== undefined;
  }

  readData(pathOrQuery) {
    if (isString(pathOrQuery)) {
      const path = pathOrQuery;
      return getDataIn(this.firebaseCache, path, undefined);
    }
    else if (isPlainObject(pathOrQuery)) {
      const {
        path,
        queryParams
      } = pathOrQuery;

      let allData = getDataIn(this.firebaseCache, path, undefined);
      
      // should not be necessary, since we already subscribed to only this subset of data anyway!

      // if (allData) {
      //   allData = applyQueryToDataSet(allData, queryParams);
      // }
      return allData;
    }
  }
}


export class FirebaseAuthProvider extends DataProviderBase {
  firebaseAuthData = undefined;

  constructor() {
    super();

    autoBind(this);
  }

  onListenerAdd(path, query, listener) {
    // add listener once the first request comes in
    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        // User is signed in.
        this.firebaseAuthData = user;
      }
      else {
        // No user is signed in.
        this.firebaseAuthData = null;
      }

      this.notifyNewData('', user);
    });
  }

  _onError(err) {
    console.error(`[${this.constructor.name}] ${err.stack}`);
  }

  isDataLoaded(path) {
    return this.firebaseAuthData !== undefined;
  }

  readData(path) {
    console.assert(isString(path), 'invalid path in FirebaseDataProvider, path must be string: ' + path);
    return getDataIn(this.firebaseAuthData, path, undefined);
  }
}
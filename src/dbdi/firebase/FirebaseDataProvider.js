import firebase from 'firebase';

import DataProviderBase from '../DataProviderBase';

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

  _onNewData(path, snap) {
    const val = snap.val();
    console.log('R [', path, '] ', val);
    setDataIn(this.firebaseCache, path, val);

    this.notifyNewData(path, val);
  }

  _onError(err) {
    console.error(`[${this.constructor.name}] ${err.stack}`);
  }

  onListenerAdd(path, listener) {
    const hook = snap => this._onNewData(path, snap);
    firebase.database().ref(path).on('value',
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

  readData(path) {
    return getDataIn(this.firebaseCache, path, undefined);
  }
}


export class FirebaseAuthProvider extends DataProviderBase {
  firebaseAuthData = undefined;

  constructor() {
    super();

    autoBind(this);
  }

  onListenerAdd(path, listener) {
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
    return getDataIn(this.firebaseAuthData, path, undefined);
  }
}
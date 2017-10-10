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


// ################################################
// MiniRefWrapper
// ################################################



// class MiniRefWrapper {
//   getRef(path) {
//     // get firebase ref object at given path
//     return path && this._ref.child(path) || this._ref;
//   }

//   onBeforeWrite(ref, val) {
//     return true;
//   }

//   onFinalizeWrite(ref, val) {
//     if (DEBUG_WRITES) {
//       console.log('Writing to path: ' + ref);
//     }
//     if (isPlainObject(val) && this.indices) {
//       this.indices.updateIndices(val);
//     }
//     return true;
//   }

//   onAfterWrite(ref, actionName, val) {
//     return this.onAfterWritePath(actionName, val, '');
//   }

//   onAfterWritePath(actionName, val, relPath) {
//     //logDBAction(pathJoin(this.pathTemplate, relPath), actionName, val);
//   }

//   onPush(ref, val) {
//     if (isPlainObject(val) && isFunction(this._decorateUpdatedAt)) {
//       this._decorateUpdatedAt(val);
//     }
//     return true;
//   }

//   onUpdate(ref, val) {
//     if (isPlainObject(val) && isFunction(this._decorateUpdatedAt)) {
//       this._decorateUpdatedAt(val);
//     }
//     return true;
//   }

//   _onError(action, ref, err) {
//     throw new Error(`${action} (at ${ref})\n${err.stack}`);
//   }

//   _doPushChild(val, childName, childPath) {
//     const ref = this.getRef(childPath);
//     return this._doPush(ref, val[childName]);
//   }

//   _doPush(ref, newChild) {
//     try {
//       const pushCheck = this.onBeforeWrite() &&
//         this.onPush(ref, newChild) &&
//         this.onFinalizeWrite(ref, newChild);

//       if (pushCheck) {
//         const newRef = ref.push(newChild);
//         //newRef.then(() => this.onAfterWrite('push', newChild));
//         return newRef;
//       }
//       return Promise.reject();
//     }
//     catch (err) {
//       this._onError('push', ref, err);
//     }
//   }

//   push(newChild) {
//     if (this._groupBy) {
//       // TODO: this is still untested.
//       // this is a group with data split over multiple paths:
//       // 1) push to first path,  2) get id,  3) use new id to set other paths
//       const childrenPathsArr = Object.entries(this._childrenGetPushPaths);
//       const firstPath = first(childrenPathsArr);
//       const otherPaths = tail(childrenPathsArr);

//       return this._doPushChild(newChild, ...firstPath[1])
//         .then(firstNewRef => {
//           // TODO: Handle more complex grouping scenarios
//           const newId = firstNewRef.key;
//           const otherNewRefs =
//             otherPaths.map(([childName, childPath]) =>
//               this[`set_${childName}`](newId, newChild[childName])
//             );
//           return Promise.all([
//             firstNewRef,
//             ...otherNewRefs
//           ]);
//         });
//     }
//     else {
//       return this._doPush(this._ref, newChild);
//     }
//   }

//   pushChild(path, newChild) {
//     // TODO: use proper decorators for descendant paths
//     return this._doPush(this.getRef(path), newChild);
//   }

//   _doSet(val) {
//     const ref = this._ref;
//     try {
//       return (
//         this.onBeforeWrite(ref, val) &&
//         this.onUpdate(ref, val) &&
//         this.onFinalizeWrite(ref, val) &&

//         ref.set(val)
//           .then(() => this.onAfterWrite('set', this.val))
//       );
//     }
//     catch (err) {
//       this._onError('set', ref, err);
//     }
//   }

//   set(val) {
//     if (this._groupBy) {
//       return Promise.all(map(this._childrenGetPushPaths,
//         (childPath, childName) =>
//           val[childName] && this[`set_${childName}`](val[childName])
//       ).filter(promise => !!promise)
//       );
//     }
//     else {
//       return this._doSet(val);
//     }
//   }

//   setByIndex(indexData, childValue) {
//     const key = this.indices.encodeQueryValue(indexData);
//     return this.setChild(key, childValue);
//   }

//   setChild(path, childValue) {
//     // TODO: use proper decorators for descendant paths
//     const ref = this.getRef(path);
//     try {
//       return (
//         this.onBeforeWrite(ref, childValue) &&
//         this.onUpdate(ref, childValue) &&
//         this.onFinalizeWrite(ref, childValue) &&
//         ref.set(childValue)
//           .then(() => {
//             this.onAfterWritePath('set', childValue, path);
//             //console.log(`setChild: ${ref} = ${childValue}`);
//           })
//       );
//     }
//     catch (err) {
//       this._onError('setChild', ref, err);
//     }
//   }

//   _doUpdate(val) {
//     const ref = this._ref;
//     try {
//       return (
//         this.onBeforeWrite(ref, val) &&
//         this.onUpdate(ref, val) &&
//         this.onFinalizeWrite(ref, val) &&

//         ref.update(val)
//           .then(() => {
//             // TODO: sadly, value is not yet updated in local repository
//             const newVal = val;
//             return this.onAfterWrite('update',
//               newVal
//               //_.zipObject(_.keys(val), _.map(val, (v,k) => _.get(newVal, k)))
//             );
//           })
//       );
//     }
//     catch (err) {
//       this._onError('update', ref, err);
//     }
//   }

//   update(val) {
//     if (this._groupBy) {
//       return Promise.all(map(this._childrenGetPushPaths,
//         (childPath, childName) =>
//           val[childName] && this[`update_${childName}`](val[childName])
//       ).filter(promise => !!promise));
//     }
//     else {
//       return this._doUpdate(val);
//     }
//   }

//   updateChild(path, childValue) {
//     // TODO: use proper decorators for descendant paths
//     const ref = this.getRef(path);
//     try {
//       return (
//         this.onBeforeWrite(ref, childValue) &&
//         this.onUpdate(ref, childValue) &&
//         this.onFinalizeWrite(ref, childValue) &&

//         ref.update(childValue)
//           .then(() => {
//             const newVal = childValue;
//             return this.onAfterWritePath('update',
//               newVal
//               // _.zipObject(
//               //   _.keys(childValue), 
//               //   _.map(childValue, (v, k) => getDataIn(childValue, k))
//               // )
//               , path);
//           })
//       );
//     }
//     catch (err) {
//       this._onError('updateChild', ref, err);
//     }
//   }
  
//     // see: https://firebase.google.com/docs/reference/js/firebase.database.Reference#transaction
//     // transactionChild(cb) {
//     //   // TODO: add write hooks!!!
//     //   const ref = this._ref;
//     //   try {
//     //     return (
//     //       this.onBeforeWrite() &&
//     //       ref.transaction(cb)
//     //         .then(() => this.onAfterWrite('transaction', '?'))
//     //     );
//     //   }
//     //   catch (err) {
//     //     this._onError('transactionChild', ref, err);
//     //   }
//     // }

//     // transactionChild(path, cb) {
//     //   // TODO: add write hooks!!!
//     //   const ref = this.getRef(path);
//     //   try {
//     //     return (
//     //       this.onBeforeWrite() &&
//     //       ref.transaction(cb)
//     //         .then(() => this.onAfterWritePath('transaction', '?', path))
//     //     );
//     //   }
//     //   catch (err) {
//     //     this._onError('transactionChild', ref, err);
//     //   }
//     // }
// }

// const writers = {
//   batchUpdate(update) {
//     return update[path] = update[path] && merge(update[path], data) || data;
//   },

//   delete() {
//     return this.setChild(path, null);
//   }
  
//   /*
//     const pathTemplate = pathJoin(parentPathTemplate, childPath);
//     const getPath = createPathGetterFromTemplateArray(pathTemplate, variableTransform);
//     const pushGetPath = createPathGetterFromTemplateArray(parentPathTemplate, variableTransform);
//   */
// };
import isPlainObject from 'lodash/isPlainObject';
import isFunction from 'lodash/isFunction';
import isArray from 'lodash/isArray';

import autoBind from 'src/util/auto-bind';

import DataDescriptorNode from './DataDescriptorNode';
import PathDescriptor from './PathDescriptor';


const DEBUG_WRITES = true;

export default class DataWriteDescriptor extends DataDescriptorNode {
  writeData;

  constructor(cfg) {
    super(cfg);

    autoBind(this);

    this._buildWriteData(cfg);
  }

  get nodeType() {
    return 'DataWrite';
  }

  // ################################################
  // Private properties + methods
  // ################################################

  _buildWriteData(cfg) {
    let writeData;
    if (cfg instanceof PathDescriptor) {
      // build writer from pathDescriptor
      writeData = this._buildWriteDataFromDescriptor(cfg);
    }
    else if (isFunction(cfg)) {
      // custom writer function
      writeData = cfg;
    }
    else {
      throw new Error('Could not make sense of DataWriteDescriptor config node: ' + JSON.stringify(cfg));
    }
    this.writeData = this._wrapAccessFunction(writeData);
  }

  _doGetPath(pathDescriptor, args, writeByNameProxy, readersByName, callerNode, accessTracker) {
    const pathOrPaths = pathDescriptor.getPath(args, writeByNameProxy, readersByName, callerNode, accessTracker);

    if (pathOrPaths) {
      if (isArray(pathOrPaths)) {
        throw new Error('');
      }
      else {
        const path = pathOrPaths;
        return path;
      }
    }

    throw new Error('Tried to write to path but not all arguments were provided: ' + this.fullName);
  }

  _buildWriteDataFromDescriptor(pathDescriptor) {
    return (args, writeByNameProxy, readersByName, callerNode, accessTracker) => {
      // // TODO check if all dependencies are loaded?
      // if (!callerNode.areDependenciesLoaded(this)) {
      //   return null;
      // }
      
      const path = this._doGetPath(pathDescriptor, args, writeByNameProxy, readersByName, callerNode, accessTracker);
      return this._doWriteData(path, callerNode, accessTracker);
    };
  }

  _buildDoWriteData(path, callerNode, accessTracker, writerFunction) {
    this._doWriteData = function _doWriteData(path, callerNode, accessTracker) {
      const {
        dataProvider
      } = callerNode;

      //accessTracker.recordDataWrite(dataProvider, path);
      return '???';
      //dataProvider.writeData(path, val);
    };
  } 
}

// ################################################
// MiniRefWrapper
// ################################################

// TODO: I just wanna click a button and have it save data!!!
// TODO: allow to easily integrate the other features later, but start without anything fancy

// TODO: advanced features
// updatedAt
// implicit (one-to-one + one-to-many) indices
// explicit (many-to-many) indices
// groupBy

class MiniRefWrapper {
  getRef(path) {
    // get firebase ref object at given path
    return path && this._ref.child(path) || this._ref;
  }

  onBeforeWrite(ref, val) {
    return true;
  }

  onFinalizeWrite(ref, val) {
    if (DEBUG_WRITES) {
      console.log('Writing to path: ' + ref);
    }
    if (isPlainObject(val) && this.indices) {
      this.indices.updateIndices(val);
    }
    return true;
  }

  onAfterWrite(ref, actionName, val) {
    return this.onAfterWritePath(actionName, val, '');
  }

  onAfterWritePath(actionName, val, relPath) {
    //logDBAction(pathJoin(this.pathTemplate, relPath), actionName, val);
  }

  onPush(ref, val) {
    if (isPlainObject(val) && isFunction(this._decorateUpdatedAt)) {
      this._decorateUpdatedAt(val);
    }
    return true;
  }

  onUpdate(ref, val) {
    if (isPlainObject(val) && isFunction(this._decorateUpdatedAt)) {
      this._decorateUpdatedAt(val);
    }
    return true;
  }

  _onError(action, ref, err) {
    throw new Error(`${action} (at ${ref})\n${err.stack}`);
  }

  _doPushChild(val, childName, childPath) {
    const ref = this.getRef(childPath);
    return this._doPush(ref, val[childName]);
  }

  _doPush(ref, newChild) {
    try {
      const pushCheck = this.onBeforeWrite() &&
        this.onPush(ref, newChild) &&
        this.onFinalizeWrite(ref, newChild);

      if (pushCheck) {
        const newRef = ref.push(newChild);
        //newRef.then(() => this.onAfterWrite('push', newChild));
        return newRef;
      }
      return Promise.reject();
    }
    catch (err) {
      this._onError('push', ref, err);
    }
  }

  push(newChild) {
    if (this._groupBy) {
      // TODO: this is still untested.
      // this is a group with data split over multiple paths:
      // 1) push to first path,  2) get id,  3) use new id to set other paths
      const childrenPathsArr = Object.entries(this._childrenGetPushPaths);
      const firstPath = first(childrenPathsArr);
      const otherPaths = tail(childrenPathsArr);

      return this._doPushChild(newChild, ...firstPath[1])
        .then(firstNewRef => {
          // TODO: Handle more complex grouping scenarios
          const newId = firstNewRef.key;
          const otherNewRefs =
            otherPaths.map(([childName, childPath]) =>
              this[`set_${childName}`](newId, newChild[childName])
            );
          return Promise.all([
            firstNewRef,
            ...otherNewRefs
          ]);
        });
    }
    else {
      return this._doPush(this._ref, newChild);
    }
  }

  pushChild(path, newChild) {
    // TODO: use proper decorators for descendant paths
    return this._doPush(this.getRef(path), newChild);
  }

  _doSet(val) {
    const ref = this._ref;
    try {
      return (
        this.onBeforeWrite(ref, val) &&
        this.onUpdate(ref, val) &&
        this.onFinalizeWrite(ref, val) &&

        ref.set(val)
          .then(() => this.onAfterWrite('set', this.val))
      );
    }
    catch (err) {
      this._onError('set', ref, err);
    }
  }

  set(val) {
    if (this._groupBy) {
      return Promise.all(map(this._childrenGetPushPaths,
        (childPath, childName) =>
          val[childName] && this[`set_${childName}`](val[childName])
      ).filter(promise => !!promise)
      );
    }
    else {
      return this._doSet(val);
    }
  }

  setByIndex(indexData, childValue) {
    const key = this.indices.encodeQueryValue(indexData);
    return this.setChild(key, childValue);
  }

  setChild(path, childValue) {
    // TODO: use proper decorators for descendant paths
    const ref = this.getRef(path);
    try {
      return (
        this.onBeforeWrite(ref, childValue) &&
        this.onUpdate(ref, childValue) &&
        this.onFinalizeWrite(ref, childValue) &&
        ref.set(childValue)
          .then(() => {
            this.onAfterWritePath('set', childValue, path);
            //console.log(`setChild: ${ref} = ${childValue}`);
          })
      );
    }
    catch (err) {
      this._onError('setChild', ref, err);
    }
  }

  _doUpdate(val) {
    const ref = this._ref;
    try {
      return (
        this.onBeforeWrite(ref, val) &&
        this.onUpdate(ref, val) &&
        this.onFinalizeWrite(ref, val) &&

        ref.update(val)
          .then(() => {
            // TODO: sadly, value is not yet updated in local repository
            const newVal = val;
            return this.onAfterWrite('update',
              newVal
              //_.zipObject(_.keys(val), _.map(val, (v,k) => _.get(newVal, k)))
            );
          })
      );
    }
    catch (err) {
      this._onError('update', ref, err);
    }
  }

  update(val) {
    if (this._groupBy) {
      return Promise.all(map(this._childrenGetPushPaths,
        (childPath, childName) =>
          val[childName] && this[`update_${childName}`](val[childName])
      ).filter(promise => !!promise));
    }
    else {
      return this._doUpdate(val);
    }
  }

  updateChild(path, childValue) {
    // TODO: use proper decorators for descendant paths
    const ref = this.getRef(path);
    try {
      return (
        this.onBeforeWrite(ref, childValue) &&
        this.onUpdate(ref, childValue) &&
        this.onFinalizeWrite(ref, childValue) &&

        ref.update(childValue)
          .then(() => {
            const newVal = childValue;
            return this.onAfterWritePath('update',
              newVal
              // _.zipObject(
              //   _.keys(childValue), 
              //   _.map(childValue, (v, k) => getDataIn(childValue, k))
              // )
              , path);
          })
      );
    }
    catch (err) {
      this._onError('updateChild', ref, err);
    }
  }
  
    // see: https://firebase.google.com/docs/reference/js/firebase.database.Reference#transaction
    // transactionChild(cb) {
    //   // TODO: add write hooks!!!
    //   const ref = this._ref;
    //   try {
    //     return (
    //       this.onBeforeWrite() &&
    //       ref.transaction(cb)
    //         .then(() => this.onAfterWrite('transaction', '?'))
    //     );
    //   }
    //   catch (err) {
    //     this._onError('transactionChild', ref, err);
    //   }
    // }

    // transactionChild(path, cb) {
    //   // TODO: add write hooks!!!
    //   const ref = this.getRef(path);
    //   try {
    //     return (
    //       this.onBeforeWrite() &&
    //       ref.transaction(cb)
    //         .then(() => this.onAfterWritePath('transaction', '?', path))
    //     );
    //   }
    //   catch (err) {
    //     this._onError('transactionChild', ref, err);
    //   }
    // }
}

const writers = {
  batchUpdate(update) {
    return update[path] = update[path] && merge(update[path], data) || data;
  },

  delete() {
    return this.setChild(path, null);
  }
  
  /*
    const pathTemplate = pathJoin(parentPathTemplate, childPath);
    const getPath = createPathGetterFromTemplateArray(pathTemplate, variableTransform);
    const pushGetPath = createPathGetterFromTemplateArray(parentPathTemplate, variableTransform);
  */
};
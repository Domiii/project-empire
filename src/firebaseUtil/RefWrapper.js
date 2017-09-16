import _ from 'lodash';
import forEach from 'lodash/forEach';
import first from 'lodash/first';
import tail from 'lodash/tail';
import map from 'lodash/map';
import mapValues from 'lodash/mapValues';
import has from 'lodash/has';
import pickBy from 'lodash/pickBy';
import omitBy from 'lodash/omitBy';
import isArray from 'lodash/isArray';
import isString from 'lodash/isString';
import isObject from 'lodash/isObject';
import isFunction from 'lodash/isFunction';
import isEqual from 'lodash/isEqual';
import reduce from 'lodash/reduce';
import extend from 'lodash/extend';
import isEmpty from 'lodash/isEmpty';
import isPlainObject from 'lodash/isPlainObject';

import autoBind from 'src/util/auto-bind';

import { pathJoin } from 'src/util/pathUtil';
//import { createSelector } from 'reselect';

import { helpers, getFirebase } from 'react-redux-firebase';
import { EmptyObject } from 'src/util';


import { makeIndices } from './indices';
import {
  createPathGetterFromTemplateProps,
  createPathGetterFromTemplateArray,
  createChildVarGetterFromTemplateProps,
  parseTemplateString,

  getDataIn,
  dataToJS
} from './dataUtil';

import {
  createDataAccessors
} from './dataAccessors';


const DEBUG_WRITES = false;

const {
  isLoaded,
  populate
} = helpers;

const defaultConfig = {
  pushedAt(val) {
    val.updatedAt = getFirebase().database.ServerValue.TIMESTAMP;
  },
  updatedAt(val) {
    val.updatedAt = getFirebase().database.ServerValue.TIMESTAMP;
  }
};

function makeUpdatedAt(propName) {
  return function updatedAt(val) {
    val[propName] = getFirebase().database.ServerValue.TIMESTAMP;
  };
}

// this "cache" is a first attempt at 
//    minimizing react re-render calls by
//    always returning the same instance at a given path
const dataCache = {};

function _cachePut(path, args, data) {
  let entry = dataCache[path];
  if (!entry) {
    entry = {};
  }
  entry.args = args;
  entry.data = data;
}

function _cacheGet(path, args) {
  const entry = dataCache[path];
  if (entry && isEqual(args, entry.args)) {
    return entry.data;
  }
  return null;
}

function _cacheLookup(path, args, newData) {
  const oldData = _cacheGet(path, args);

  if (!isEqual(newData, oldData)) {
    // update cache
    _cachePut(path, args, newData);
    return newData;
  }
  return oldData;
}

function _cachedFetchPopulate(firebaseState, path, queryArgs) {
  const newData = populate(firebaseState, path, queryArgs.populates);
  return _cacheLookup(path, queryArgs, newData);
}

function _cachedFetchPlain(firebaseState, path) {
  const newData = dataToJS(firebaseState, path);
  return _cacheLookup(path, null, newData);
}

// return function to get data at given path 
// from current state in store
function makeGetDataDefault(firebaseState, path, queryArgs) {
  if (isPlainObject(queryArgs) && queryArgs.populates) {
    return () => _cachedFetchPopulate(firebaseState, path, queryArgs);
  }
  return () => _cachedFetchPlain(firebaseState, path);
}

/**
 * Provide path, relative to parent (root) path, given user-provided props object.
 * MUST be provided for all children. OPTIONAL in root.
 * @callback makeRefWrapper~getPathFunc
 * @param {object} props
 */

/**
 * Wrap data access to a specific path in your Firebase DB (and it's child paths).
 * NOTE that the `redux-react-firebase` module internally already takes care of
 *    dispatching actions for firebase operations and reducing firebase data.
 * 
 * @param {object|string} cfgOrPath.pathTemplate|cfgOrPath The path of the given ref wrapper.
 * @param {object} [cfgOrPath.children] Children wrappers within the same rootPath.
 * @param {object} [cfgOrPath.methods] Custom set of methods (selectors/actions) for this specific data set.
 * @param {object} [cfgOrPath.inheritedMethods] These methods will be assigned to self and all children.
 * @param {object} [cfgOrPath.cascadingMethods] These methods will be assigned to self and all parents, but parameters will be filled from props, according to all variables in full path.
 * 
 * returns a new ref wrapper function (firebaseState, props) with the following properties:
 *  parent, getPath, and all corresponding child wrapper functions
 *
 * TODO: Use reselect + internal caching so we can reduce re-creation of wrappers
 */
export function makeRefWrapper(cfgOrPath) {
  return _makeRefWrapper(null, defaultConfig, cfgOrPath);
}

export function addChildrenToRefWrapper(parent, children, inheritedSettings, cascadingMethods) {
  inheritedSettings = inheritedSettings || defaultConfig;
  const childrenWrappers = {};

  for (let wrapperName in children) {
    const childCfg = children[wrapperName];
    const childWrapper = parent[wrapperName] =
      _makeRefWrapper(parent, inheritedSettings, childCfg);

    if (cascadingMethods && childCfg.cascadingMethods) {
      // add all descendant cascading methods as well
      Object.assign(cascadingMethods, childCfg.cascadingMethods);
    }
    childrenWrappers[wrapperName] = childWrapper;
  }

  return childrenWrappers;
}

// TODO: currently unused
function logDBAction(pathTemplate, actionName, args) {
  try {
    if (isObject(args) && has(args, 'updatedAt')) {
      // TODO: hack-around to get rid of firebase TIMESTAMP placeholder
      args = omitBy(args, (v, k) => k === 'updatedAt');
    }
    const argsString = JSON.stringify(args);
    console.debug(`[LOG] Action: ${actionName}("${pathTemplate}", ${argsString})`);
  }
  catch (err) {
    console.error(`Failed to log action: "${actionName}" at "${pathTemplate}"`);
    console.error(err.stack);
  }
}

// function logWrapper(pathTemplate, actionName, fn) {
//   return function logWrapped(...args) {
//     logDBAction(pathTemplate, actionName, args);
//     return fn.apply(this, args);
//   };
// }

// function logDecoratePrototype(pathTemplate, proto) {
//   for (const prop in proto) {
//     const val = proto[prop];

//     if (_.isFunction(val)) {
//       proto[prop] = logWrapper(pathTemplate, prop, val);
//     }
//   }
// }


function _buildQueryFinal(path, args) {
  if (isEmpty(args)) {
    return path;
  }
  else if (isString(args)) {
    return `${path}#${args}`;
  }
  else if (isArray(args)) {
    args = args.filter(arg => !isEmpty(arg));
    args.forEach(arg => {
      if (!isString(arg)) {
        throw new Error('invalid argument - must be string: ' + arg +
          ' (' + arg && JSON.stringify(arg) + ')');
      }
    });
    return ({
      path,
      queryParams: args
    });
  }
  else if (isPlainObject(args)) {
    return ({
      path,
      ...args
    });
  }
  else {
    throw new Error('Invalid query arguments: ' + JSON.stringify(args));
  }
}

// returns a function which converts query objects 
//    into propriotory `redux-react-firebase` query syntax
// see: https://github.com/tiberiuc/redux-react-firebase/blob/master/API.md#examples
function _makeMakeQuery(getPath, queryString) {
  let queryArgsFunc = queryString instanceof Function && queryString;
  let queryArgsConst = !(queryString instanceof Function) && queryString;
  let getQueryArgs = (...allArgs) => {
    let res = queryArgsFunc && queryArgsFunc.apply(this, allArgs) ||
      (!isEmpty(allArgs) ? allArgs : queryArgsConst);
    return res;
  };

  function _defaultMakeQueryWithVariables(pathArgs, ...customArgs) {
    const path = getPath(pathArgs);
    const queryArgs = getQueryArgs.call(this, ...customArgs, ...pathArgs);
    return _buildQueryFinal(path, queryArgs);
  }

  function _defaultMakeQueryNoVariables(...customArgs) {
    const path = getPath();
    const queryArgs = getQueryArgs.call(this, ...customArgs);
    return _buildQueryFinal(path, queryArgs);
  }

  return getPath.hasVariables &&
    _defaultMakeQueryWithVariables ||
    _defaultMakeQueryNoVariables;
}

function _addQueries(makeQuery, paths, ...args) {
  const newPaths = makeQuery(...args);
  if (isArray(newPaths)) {
    paths.push.apply(paths, newPaths);
  }
  else {
    paths.push(newPaths);
  }
}

// if this level is group, add queries of children
function _makeAddQuery(makeQuery, groupBy, childrenWrappers) {
  if (!isEmpty(groupBy)) {
    // when groupBy is given, we actually want to query all children instead
    return (paths, ...args) => {
      forEach(childrenWrappers, (child, childName) => {
        _addQueries(child.makeQuery, paths, ...args);
      });
    };
  }
  else {
    // just add the query at this level
    return _addQueries.bind(null, makeQuery);
  }
}

function _makeRefWrapper(parent, inheritedSettings, cfgOrPath) {
  let cfg;
  if (isString(cfgOrPath)) {
    cfg = { pathTemplate: cfgOrPath };
  }
  else {
    cfg = cfgOrPath;
  }
  console.assert(!!cfg, 'config was not provided under: ' + (parent && parent.pathTemplate));

  // groupBy needs special treatment
  //const groupBy = (inheritedSettings.groupBy || []).concat(cfg.groupBy || []);
  inheritedSettings = Object.assign({}, inheritedSettings, cfg);
  //inheritedSettings.groupBy = groupBy;

  // some configuration parameters only affect the current config node
  let {
    pathTemplate, pushPathTemplate, children,
    // static, // cannot get static here because it's a reserved keyword
    methods, inheritedMethods, cascadingMethods,
    groupBy
  } = cfg;

  // some configuration parameters are inherited down the chain
  let {
    indices,
    updatedAt,
    queryString,
    makeQuery
  } = inheritedSettings;

  const relativePathTemplate = pathTemplate || '';
  pathTemplate = parent &&
    pathJoin(parent.pathTemplate, relativePathTemplate) ||
    relativePathTemplate;

  pushPathTemplate = pushPathTemplate || pathTemplate;

  indices = makeIndices(indices || {});

  const variableTransform = indices.encodeQueryValue.bind(indices);
  const getPath = createPathGetterFromTemplateProps(pathTemplate, variableTransform);
  const getRelativePath = createPathGetterFromTemplateArray(relativePathTemplate, variableTransform);
  const getRelativePushPath = createPathGetterFromTemplateArray(pushPathTemplate, variableTransform);
  const getChildVars = createChildVarGetterFromTemplateProps(pathTemplate, groupBy);
  const WrapperClass = createRefWrapperBase();

  // create the factory function
  const func = createWrapperFunc(parent, WrapperClass, getPath, groupBy, getChildVars);
  if (cfg.static) {
    Object.assign(func, cfg.static);
  }
  func.parent = parent;
  func.getPath = getPath;
  func.getPushPath = getRelativePushPath;
  func.getRelativePath = getRelativePath;
  func.getRelativePushPath = getRelativePushPath;
  func.getChildVars = getChildVars;
  func.relativePathTemplate = relativePathTemplate;
  func.pathTemplate = pathTemplate;
  func.inheritedMethods = inheritedMethods;
  func.indices = indices;
  func.groupBy = groupBy;
  func.makeQuery = (makeQuery || _makeMakeQuery.call(func, getPath, queryString)).bind(func);
  func.WrapperClass = WrapperClass;

  // recurse and add all children
  cascadingMethods = cascadingMethods || {};

  let childrenWrappers;
  if (children) {
    childrenWrappers = addChildrenToRefWrapper(func, children, inheritedSettings, cascadingMethods);
  }

  func.childrenWrappers = childrenWrappers = childrenWrappers || {};
  func.addQuery = _makeAddQuery(func.makeQuery, groupBy, childrenWrappers);

  // work out indices
  WrapperClass.prototype.indices = indices;

  // add pushedAt + updatedAt to prototype
  // if (isFunction(inheritedSettings.pushedAt)) {
  //   WrapperClass.prototype._decoratePushedAt = inheritedSettings.pushedAt;
  // }
  if (isFunction(updatedAt)) {
    WrapperClass.prototype._decorateUpdatedAt = updatedAt;
  }
  else if (isString(updatedAt)) {
    WrapperClass.prototype._decorateUpdatedAt = makeUpdatedAt(updatedAt);
  }

  // add push,get,set,update,delete accessors
  createDataAccessors(WrapperClass.prototype, children, variableTransform);

  // add inheritedMethods
  inheritedMethods = inheritedMethods || {};
  if (parent && parent.inheritedMethods) {
    Object.assign(inheritedMethods, parent.inheritedMethods);
  }
  Object.assign(WrapperClass.prototype, inheritedMethods);

  // add cascadingMethods
  const varNames = parseTemplateString(pathTemplate).varNames;
  cascadingMethods = _.mapValues(cascadingMethods, function (method, name) {
    // all arguments of cascading methods, are:
    //  1. the arguments already stored in wrapper props
    //  2. run-time supplied arguments
    return (...args2) => {
      const props = this.props;
      const args1 = varNames.map(varName => props[varName]);
      return method.call(this, ...args1.concat(args2));
    };
  });
  Object.assign(WrapperClass.prototype, cascadingMethods);

  // add methods
  if (methods) {
    Object.assign(WrapperClass.prototype, methods);
  }

  // log all possible DB actions (that we are aware of)
  //logDecoratePrototype(pathTemplate, WrapperClass.prototype);

  autoBind(func);

  return func;
}


// function getVariablesFromPath(path) {
//   const vars = [];
//   const re = /\$\(([^)]+)\)/g;
//   let match;
//   while ((match = re.exec(path || '')) != null) {
//     let varName = match[1];
//     vars.push(varName);
//   }

//   return vars;
// }



// TODO: wrapper cache not working o_X
const _wrapperCache = {};

function _cacheGetWrapper(path, firebaseState, ...moreArgs) {
  const entries = _wrapperCache[path];
  if (entries) {
    for (let i = 0; i < entries.length; ++i) {
      const entry = entries[i];
      if (firebaseState.data === firebaseState.data &&
        isEqual(entry.moreArgs, moreArgs)) {
        //console.log('retrieved cached wrapper at path: ' + path);
        console.log(path, entry.obj.val, ' -- ', entry.oldVal);
        return entry.obj;
      }
    }
  }
  //console.log('no cached wrapper at path: ' + path);
  return null;
}

function _cacheSetWrapper(obj, path, firebaseState, ...moreArgs) {
  let entries = _wrapperCache[path];
  if (!entries) {
    _wrapperCache[path] = entries = [];
  }
  else if (entries.length > 10) {
    // keep a tap on cache size
    entries.splice(0, 1);
  }

  _cacheGetWrapper(path, firebaseState, ...moreArgs);

  entries.push({
    obj,
    firebaseState,
    moreArgs,
    oldVal: obj.val
  });
}

function createWrapperFunc(parent, WrapperClass, getPath, groupBy, getChildVars) {
  const f = (firebaseState, props, pathArgs, ...makeQueryArgs) => {
    pathArgs = pathArgs || props || EmptyObject;
    props = props || EmptyObject;

    let path = getPath(pathArgs);
    path = path.endsWith('/') ? path.substring(0, path.length - 1) : path;

    if (!firebaseState) {
      throw new Error('invalid ref wrapper initialization, missing `firebase` data root: ' + path);
    }

    //console.log('creating wrapper at: ' + path);
    const {
      makeQuery,
      relativePathTemplate
    } = f;

    // we need queryArgs when getting data for populate (et al)
    const queryArgs = makeQueryArgs.length && makeQuery(...makeQueryArgs) || null;

    // for groups, make sure, we get instance to chidren
    let childArgs, childrenWrappers,
      childrenGetPaths, childrenGetPushPaths;

    if (groupBy) {
      childArgs = getChildVars(pathArgs);
      childrenWrappers = f.childrenWrappers;
      childrenGetPaths = mapValues(childrenWrappers, childF => {
        return childF.getRelativePath;
      });
      childrenGetPushPaths = mapValues(childrenWrappers, childF => {
        return childF.getRelativePushPath;
      });

      // childrenGetPaths = childrenWrappers.map(childF => {
      //   return childF(firebaseState, props, pathArgs, ...makeQueryArgs);
      // });
    }

    let getData;
    getData = makeGetDataDefault(firebaseState, path, queryArgs);

    const db = props.db || getFirebase().database();
    const ref = db.ref(path);

    // check if something is in cache
    // let refWrapper = _cacheGetWrapper(
    //   path, firebaseState, props, childArgs, queryArgs);
    // if (!refWrapper) {
    // create refWrapper object, if none is cached
    const refWrapper = new WrapperClass();
    //}

    // update arguments
    refWrapper._init(
      parent, path, firebaseState,
      relativePathTemplate,
      db, getData, groupBy, childArgs,
      childrenGetPaths, childrenGetPushPaths, ref, props
    );

    // // update cache
    // _cacheSetWrapper(refWrapper, 
    //   path, firebaseState, props, childArgs, queryArgs);

    return refWrapper;
  };
  return f;
}

function createRefWrapperBase() {
  class RefWrapperBase {
    constructor() {
    }

    _init(parent, path, firebaseState,
      relativePathTemplate, db,
      getData, groupBy, childArgs,
      childrenGetPaths, childrenGetPushPaths,
      ref, props) {

      this.parent = parent;
      this.path = path;
      this._firebaseState = firebaseState;

      //this._clazz = clazz;
      this._db = db;
      //this._ref = ref;

      this._ref = ref;

      // getData(path) function returns data at given database path
      this._getData = getData.bind(this);

      this._groupBy = groupBy;
      this._childrenGetPaths = childrenGetPaths;
      this._childrenGetPushPaths = childrenGetPushPaths;
      this._childArgs = childArgs;

      if (_.isFunction(this.updateProps)) {
        this.updateProps(props);
      }
      else {
        this.props = props;
      }
      autoBind(this);
    }

    get val() {
      let val = this._getData();
      if (isLoaded(val) && this._groupBy) {
        // for groups, get data from all children and merge them together
        val = mapValues(this._childrenGetPaths, getChildPath => {
          const path = getChildPath(...this._childArgs);
          return getDataIn(val, path);
        });
        val = pickBy(val, (childVal, childName) => !!childVal);
      }
      return val;
    }

    get isLoaded() {
      return isLoaded(this.val);
    }

    findKey(filter) {
      return this.val && _.findKey(this.val, filter);
    }

    /**
     * Get the object stored at this wrapper's path,
     * then get the value at the given relative path.
     */
    getData(path, defaultValue = null) {
      // if (path.startsWith('/')) {
      //   console.warn('invalid path: should not start with slash (/): ' + path);
      // }

      const obj = this._getData();
      if (!path) {
        return obj === undefined ? defaultValue : obj;
      }

      return getDataIn(obj, path, defaultValue);
    }

    getAllChildData(pathPrefix, idOrIds, defaultValue = null) {
      const ids = isArray(idOrIds) ? idOrIds : [idOrIds];

      const paths = ids.map(id =>
        pathJoin(pathPrefix, id)
      );

      return this.getAllData(paths, defaultValue);
    }

    getAllData(pathOrPaths, defaultValue = null) {
      const paths = 
        isArray(pathOrPaths) ?
          pathOrPaths : (
            !!pathOrPaths ? [pathOrPaths] : []
          );

      // create object with paths as keys and data as values
      const result = reduce(paths,
        (returnObj, path) =>
          extend(returnObj, {
            [path]: this.getData(path)
          }), {});

      return result;
      // return isArray(pathOrPaths) ?
      //   result :
      //   result[pathOrPaths];
    }

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
      if (_.isObject(val) && this.indices) {
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
      if (_.isObject(val) && _.isFunction(this._decorateUpdatedAt)) {
        this._decorateUpdatedAt(val);
      }
      return true;
    }

    onUpdate(ref, val) {
      if (_.isObject(val) && _.isFunction(this._decorateUpdatedAt)) {
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
        // push to first path, get id, and then use new id to set other paths
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

  return RefWrapperBase;
}

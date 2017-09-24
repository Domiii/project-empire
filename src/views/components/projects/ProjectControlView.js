import Roles from 'src/core/users/Roles';

import {
  ProjectStageTree,
  StageStatus
} from 'src/core/projects/ProjectDef';

import autoBind from 'src/util/auto-bind';
import { EmptyObject, EmptyArray } from 'src/util';

import map from 'lodash/map';
import forEach from 'lodash/forEach';
import isString from 'lodash/isString';
import isArray from 'lodash/isArray';
import isPlainObject from 'lodash/isPlainObject';
import isFunction from 'lodash/isFunction';
import isEmpty from 'lodash/isEmpty';
import isObject from 'lodash/isObject';
import some from 'lodash/some';
import mapValues from 'lodash/mapValues';
import filter from 'lodash/filter';
import flatMap from 'lodash/flatMap';
import find from 'lodash/find';

import React, { Component, Children } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Flex, Item } from 'react-flex';
import {
  firebaseConnect,
  getFirebase
} from 'react-redux-firebase';
import {
  Panel, Button, Alert, Well
} from 'react-bootstrap';

import FAIcon from 'src/views/components/util/FAIcon';
import LoadIndicator from 'src/views/components/util/loading';


// TODO: use DataDescriptionNode to build readers and writers

// TODO: implement firebase "applyParamsToQuery"
// TODO: Distinguish between DataProvider (e.g. cache, some firebase app, etc...) and DataSource (a access wrapper on top of a data provider)
// TODO: fix PathDescriptor
// TODO: PathDescriptor.getPath can return one path or array of paths.

// TODO: build DataReader from PathDescriptor
// TODO: DataReader has a getData method?

// TODO: build PathWriter from PathDescriptor

// TODO: Transformation functions should be PathDescriptors, or flagged correspondingly if they cannot be used that way

// TODO: Add support for data transformation functions as "data descriptors"

// TODO: Use reselect for caching results
// TODO: Add write operations
// TODO: Add ContextDataSource
// TODO: Add WebCacheDataSource

// TODO: minimize re-rendering
// TODO: All kinds of "aside" data (like "partyMembers") does not need to be real-time updated (for now)
//    -> Consider a priority flag to indicate whether data should always be real-time, or whether some data can be outdated



// ####################################################
// Getters + Enums
// ####################################################

function getStageStatus(stage) {
  if (stage.noStatus) {
    return StageStatus.None;
  }
  if (stage.stageDef.id === 'prepare') {
    return StageStatus.Finished;
  }
  return StageStatus.None;
  // TODO
}

function getStageContributors() {
  // TODO: get all contributors (party members, reviewer, guardian, etc...)
}

function getStageContributorStatus(user, stage) {
  // TODO: How to update or determine the stage status of any contributor?
  return 1;
}


// ####################################################
// Renderers
// ####################################################


const statusStyles = {
  [StageStatus.None]: {
    color: 'lightgray'
  },
  [StageStatus.NotStarted]: {
    color: 'lightgray'
  },
  [StageStatus.Started]: {
    color: 'gray'
  },
  [StageStatus.Finished]: {
    color: 'green'
  },
  [StageStatus.Failed]: {
    color: 'red'
  }
};

const statusIcons = {
  [StageStatus.None]: {
    name: ''
  },
  [StageStatus.NotStarted]: {
    name: ''
  },
  [StageStatus.Started]: {
    name: 'repeat'
  },
  [StageStatus.Finished]: {
    name: 'check'
  },
  [StageStatus.Failed]: {
    name: 'remove'
  }
};

const statusBsStyles = {
  [StageStatus.None]: 'info',
  [StageStatus.NotStarted]: 'default',
  [StageStatus.Started]: 'primary',
  [StageStatus.Finished]: 'success',
  [StageStatus.Failed]: 'danger'
};


const renderers = {

};
function StageStatusIcon({ status, ...props }) {
  const iconCfg = statusIcons[status];
  const style = statusStyles[status];
  return (<FAIcon {...iconCfg} style={style} {...props} />);
}
StageStatusIcon.propTypes = {
  status: PropTypes.number.isRequired
};

function StageContributorIcon({ user, status, groupName }) {
  // TODO: groupName classes
  const classes = 'project-contributor project-contributor-' + groupName;
  return (
    <div className={classes} style={{ backgroundImage: 'url(' + user.photoURL + ')' }}>
      {status &&
        <StageStatusIcon status={status}
          className=".project-contributor-status-icon" />
      }
    </div>
  );
}
StageContributorIcon.propTypes = {
  groupName: PropTypes.string.isRequired,
  status: PropTypes.number,
  user: PropTypes.object.isRequired
};

// Render icon + status of all responsible contributors for given stage

const StageStatusBar = //dataBind(
  ({ stageNode, stageContributors }) => {
    //return (<StageStatusIcon status={status} />);
    return (<div>
      {map(stageContributors, user =>
        <StageContributorIcon
          groupName={'???'}
          user={user}
          status={getStageContributorStatus(user, stageNode)}
        />)
      }
    </div>);
  };
//);
StageStatusBar.propTypes = {
  stageNode: PropTypes.object.isRequired
};


// ####################################################
// Util
// ####################################################
/**
 * Creates new array with new element interjected 
 * between any two existing elements.
 * The given callback returns the interjected element
 * for the three arguments: arr[index], arr[index+1], index.
 * @see https://stackoverflow.com/questions/31879576/what-is-the-most-elegant-way-to-insert-objects-between-array-elements
 */
function interject(arr, cb) {
  return flatMap(arr, (value, index, array) =>
    array.length - 1 !== index  // insert new object only if not already at the end
      ? [value, cb(value, arr[index + 1], index)]
      : value
  );
}

// ####################################################
// Actions
// ####################################################


// ####################################################
// Project tree + stage logic
// ####################################################


// TODO: ProjectsRef, ProjectStagesRef, MissionsRef, UserInfoRef

export function ProjectStageView({ stageNode }) {
  const stageDef = stageNode.stageDef;
  const title = stageDef.title;

  const order = stageNode.order;
  const status = getStageStatus(stageNode);
  const bsStyle = statusBsStyles[status];

  const header = (
    <Flex row justifyContent="space-between" alignItems="center">
      <Item>
        <span>{`${order + 1}. ${title}`}</span>
      </Item>
      <Item>
        <StageStatusBar stageNode={stageNode} />
      </Item>
    </Flex>
  );

  return (<div>
    <Panel header={header} className="no-margin no-shadow no-border project-stage-panel"
      bsStyle={bsStyle}>
      {stageNode.firstChild && (
        <div>
          <ProjectStagesView stageNode={stageNode.firstChild} />
        </div>
      )}
    </Panel>
  </div>);
}
ProjectStageView.propTypes = {
  stageNode: PropTypes.object.isRequired
};

function ProjectStageArrow({ previousNode }) {
  const status = getStageStatus(previousNode);
  const style = statusStyles[status];
  return (<FAIcon name="arrow-down" size="4em" style={style} />);
}
ProjectStageArrow.propTypes = {
  previousNode: PropTypes.object.isRequired
};

export function ProjectStagesView({ stageNode }) {
  // interject node views with arrows
  return (
    <Flex column justifyContent="center" alignItems="center">
      {
        stageNode.mapLine(node => {
          const order = node.order;
          return (<div key={order} className="full-width">
            {
              <Item className="full-width">
                <ProjectStageView
                  stageNode={node}
                />
              </Item>
            }
            {!!node.next &&
              <Item style={{ display: 'flex' }} justifyContent="center" flex="1" >
                <ProjectStageArrow previousNode={node} />
              </Item>
            }
          </div>);
        })
      }
    </Flex>
  );
}
ProjectStagesView.propTypes = {
  stageNode: PropTypes.object.isRequired
};


// ####################################################
// ProjectControlView
// ####################################################

// const activePaths = {};

// function addPath(newPath) {
//   let node = get(activePaths, newPath);
//   if (!node) {
//     node = {};
//     set(activePaths, newPath, node);
//   }
//   if (!node._paths) {
//     node._count = 0;
//   }
//   ++node._count;
// }

// function removePath(oldPath) {
//   const pathComponents = oldPath.split('/');
//   let node = get(activePaths, oldPath);
//   if (node !== null) {
//     --node._count;
//   }

//   // remove all empty nodes along the path
//   for (var i = pathComponents.length-1; i >= 0; --i) {
//     const node = get(activePaths, pathComponents);
//     if (node !== null) {
//       // TODO
//     }
//     pathComponents.pop();
//   }
// }


// ####################################################################################
// DataProviders
// ####################################################################################

import {
  createPathGetterFromTemplateProps,

  getDataIn,
  setDataIn
} from 'src/firebaseUtil/dataUtil';


class DataProviderBase {
  listenersByPath = {};
  listenerData = new Map();

  getListeners(path) {
    return this.listenersByPath[path];
  }

  registerListener(path, listener) {
    console.assert(!!listener.onNewData, '[INTERNAL ERROR] listener has no `onNewData` callback.');

    let listeners = this.getListeners(path);

    if (!listeners) {
      // first time, anyone is showing interest in this path
      this.listenersByPath[path] = listeners = new Set();
    }
    if (!listeners.has(listener)) {
      // add listener to set
      listeners.add(listener);
      this.listenerData[listener] = {
        byPath: {}
      };
    }

    if (!this.listenerData[listener].byPath[path]) {
      // register new listener for this path
      console.warn('registered path: ', path);
      const customData = this.onListenerAdd(path, listener);
      this.listenerData[listener].byPath[path] = {
        customData
      };
    }
  }

  unregisterListener(listener) {
    const listenerData = this.listenerData[listener];
    if (!!listenerData) {
      const byPath = listenerData.byPath;
      forEach(byPath, (_, path) => this.unregisterListenerPath(path, listener));
    }
  }

  unregisterListenerPath(path, listener) {
    console.log('unregister path: ' + path);

    const listeners = this.getListeners(path);
    console.assert(listeners, '[INTERNAL ERROR] listener not registered at path: ' + path);

    listeners.delete(listener);
    this.listenerData.delete(listener);

    this.onListenerRemove(path, listener);
  }

  // Any DataSource needs to implement the following three methods:

  onListenerAdd(path, listener) {
    //throw new Error('DataSource did not implement `onListenerAdd` method');
  }

  onListenerRemove(path, listener) {
    //throw new Error('DataSource did not implement `onListenerRemove` method');
  }

  notifyNewData(path, val) {
    const listeners = this.getListeners(path) || EmptyArray;
    setTimeout(() => listeners.forEach(listener => listener.onNewData(path, val)));
  }

  getData(path) {
    throw new Error('DataSource did not implement `getData` method');
  }
}

class FirebaseDataProvider extends DataProviderBase {
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
    const fb = getFirebase();
    const hook = snap => this._onNewData(path, snap);
    fb.database().ref(path).on('value',
      hook,
      this._onError);
    return hook;
  }

  onListenerRemove(path, listener, hook) {
    const fb = getFirebase();
    fb.database().ref(path).off('value', hook);
  }

  isDataLoaded(path) {
    return this.getData(path) !== undefined;
  }

  getData(path) {
    return getDataIn(this.firebaseCache, path, undefined);
  }
}

class FirebaseAuthProvider extends DataProviderBase {
  firebaseAuthData = undefined;
  isBound = false;

  constructor() {
    super();

    autoBind(this);
  }

  onListenerAdd(path, listener) {
    if (this.isBound) return;

    // add listener once the first request comes in
    getFirebase().auth().onAuthStateChanged((user) => {
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

  getData(path) {
    return getDataIn(this.firebaseAuthData, path, undefined);
  }
}

const DataProviders = {
  firebase: new FirebaseDataProvider(),
  firebaseAuth: new FirebaseAuthProvider()
  //temp: new ...(),
  //webCache: ...
};


// ####################################################################################
// DataDescriptionNode + Tree
// ####################################################################################

function parseConfigChildren(parent, children) {
  return map(children, (childCfg, name) =>
    new DataDescriptionNode(name, parent, childCfg)
  );
}
class ConfigTree {
  _roots;

  constructor(roots) {
    this._roots = parseConfigChildren(null, roots);
  }
}

/**
 * A parsed "dataConfig" object.
 * Allows composing of local descriptors built from descriptors imported from other places.
 */
class ConfigNode {
  name;
  dataProviderName;
  pathTemplate;
  pathConfig;
  reader;
  writer;
  parent;
  children;

  constructor(name, parent, cfg) {
    this.name = name;
    this.parent = parent;

    this._parseConfig(cfg);
    // TODO: make sure there are no cycles in dependency graph to avoid infinite loops
    // TODO: can also be used to be exported and added into other dataConfigs
    // TODO: more...
    //  1) allow for RefWrapper-type config parsing, with pathTemplate also to be called "path" + advanced features
    //  2) handle + properly name node types: PathDescriptor (path string + fn), reader (fn), writer (fn).
    //  3) merge all nodes back into all ascendants when not ambiguous.
    //    Note: if name is on this node, and the same name is used down the line, add the descriptor from "this node"
    //    Note: in all other cases of ambiguity, insert "ambiguous error" descriptor
  }

  _parseConfig(cfg) {
    this.dataProviderName = cfg.dataProvider || (this.parent && this.parent.dataProviderName);
    console.assert(this.dataProviderName, 'Node does not have dataProviderName: ' + name);

    if (isString(cfg)) {
      // path string
      this._parsePath(cfg);
    }
    else if (isFunction(cfg)) {
      // path transformation function
      this._parsePath(cfg);
    }
    else if (isPlainObject(cfg)) {
      // more complex descriptor node
      this._parsePath(cfg.path || cfg.pathTemplate);
      this._parseChildren(cfg);
    }
    else {
      throw new Error('could not parse invalid config object: ' + this.name);
    }
  }

  _parsePath(pathConfig) {
    if (!pathConfig) {
      this.pathConfig = EmptyObject;
      return;
    }

    let pathTemplate;
    let queryParams = null;
    let pathFn;

    if (isString(pathConfig)) {
      pathTemplate = pathConfig;
    }
    else if (isPlainObject(pathConfig)) {
      pathTemplate = pathConfig.path || pathConfig.pathTemplate;
      queryParams = pathConfig.queryParams;
    }

    if (!isString(pathTemplate)) {
      if (isFunction(pathTemplate)) {
        pathFn = pathTemplate;
      }
      pathTemplate = '';
    }

    // join with parent template
    pathTemplate = pathJoin(parent.pathConfig.pathTemplate, pathTemplate);

    this.pathConfig = {
      pathTemplate,
      queryParams,
      pathFn
    };
  }

  _parseReaders(cfg) {
    if (cfg.read || cfg.reader) {
      // a reader for this node
      this.reader = cfg.read || cfg.reader;
    }
    else if (cfg.readers) {
      // readers that are actually children of this node
      console.assert(isPlainObject(cfg.readers), 'invalid "readers" node is not plain object in: ' + this.name);
    }
  }

  _parseWriters(cfg) {
    if (cfg.write || cfg.writer) {
      // a writer for this node
      this.writer = cfg.write || cfg.writer;
    }
    else if (cfg.writers) {
      // multiple writers that are actually children of this node
      console.assert(isPlainObject(cfg.writers), 'invalid "writers" node is not plain object in: ' + this.name);
    }
  }

  _parseChildren(cfg) {
    this.children = cfg.children && parseConfigChildren(this, cfg.children) || null;
  }
}


/**
 * Each DataDescriptorNode provides a methods to: 1) get a path, 2) read data or 3) write data
 */
class DataDescriptorNode {
  _cfg;
  _knownDependencies;

  constructor(cfg) {
    this._cfg = cfg;
  }

  get name() {
    console.assert(this._cfg.name);
    return this._cfg.name;
  }

  get nodeType() {
    // TODO!
  }

  forEachNodeDFS(fn) {
    // TODO
  }

  /**
   * DescriptorNode boundCall functions have four (five) sets of arguments:
   * 
   * @param {object} namedCalls Set of all path/read calls provided to the callee. Callee decides when to make the call and with what arguments.
   * @param {object} namedCallProxy Set of all path/read calls executed right away, directly injecting the path/data to callee with no user arguments provided.
   * @param {object} args Set of user-supplied arguments.
   * @param {object} callerNode The callerNode supplies access to the DataContext, and all kinds of advanced stuff. Use with caution.
   * @param {object} writers set of required writer nodes. For writer nodes only! (Only writers can require more writers)
   * 
   * They are called from the DataContextNodeBindings which supplies the data the node requests.
   * 
   * When nodes are called upon the first time, all data read sights are
   * automatically added as dependencies and their loading initialized.
   * 
   * When a call is made:
   * 1) All injected data is automatically added to data dependencies immediately.
   * 2) descriptor arguments are NOT added immediately, only after they are called.
   * 
   * @return {object or array} Returns one or more sets of data or paths
   */
  boundCall(namedCalls, namedCallProxy, args, callerNode) {
    throw new Error('DescriptorNode did not implement boundCall: ' + this.constructor.name);
  }

  toString() {
    return `[${this.constructor.name}] ${this.name}`;
  }

  getDependencies() {
    return this._knownDependencies;
  }

  /**
   * Protected method, called by descriptor nodes to indicate previously known dependencies.
   * 
   * @param {*} dependencies 
   */
  _setDependencies(dependencies) {
    this._knownDependencies = dependencies;
  }

  _wrapAccessFunction(fn) {
    return function _wrappedAccessFunction(namedCalls, namedCallProxy, args, callerNode) {
      try {
        return fn(namedCalls, namedCallProxy, args, callerNode);
      }
      catch (err) {
        console.error(`Failed to execute "${this.nodeType}" function at "${this.name}":`, err.stack);
        return undefined;
      }
    };
  }
}


class PathDescriptor extends DataDescriptorNode {
  _pathConfig;
  getPath;

  constructor(pathConfig) {
    super();

    this._pathConfig = pathConfig;

    autoBind(this);

    this._buildPathGetter(pathConfig);
  }

  _buildPathGetter(pathConfig) {
    let getPath;
    const { pathTemplate, queryParams, pathFn } = pathConfig;
    if (!pathFn) {
      getPath = this._buildGetPathFromTemplateString(path, queryParams);
    }
    else {
      getPath = pathFn;
    }

    // finally, wrap path getter call
    this.getPath = this._wrapGetPath(getPath);
  }

  _wrapGetPath(getPath) {
    return function _wrappedGetPath(namedCalls, namedCallProxy, args, callerNode) {
      let path;
      try {
        path = getPath(namedCalls, namedCallProxy, args, callerNode);
      }
      catch (err) {
        throw new Error('Failed to execute getPath at: ' + this + ' - ' + err.stack);
      }

      if (!isString(path) && !isArray(path)) {
        // TODO: (low prio) Proper type checking (e.g.: https://github.com/gkz/type-check)
        throw new Error('getPath did not return string or array-of-string at: ' + this);
      }
      return path;
    };
  }

  _buildGetPathFromTemplateString(pathTemplate) {
    const getPathRaw = createPathGetterFromTemplateProps(pathConfig);
    const argNames = getPathRaw.pathInfo && getPathRaw.pathInfo.varNames;
    return function _getPathFromTemplateString(namedCalls, namedCallProxy, args, callerNode) {
      return getPathRaw(args);
    };
  }

  // ################################################
  // Public properties + methods
  // ################################################

  boundCall(namedCalls, namedCallProxy, args, callerNode) {
    // call path read function
    return this.getPath(namedCalls, namedCallProxy, args, callerNode);
  }
}


class DataReadDescriptor extends DataDescriptorNode {
  getData;
  
  constructor(cfg) {
    super(cfg);

    autoBind(this);

    this._buildGetData(cfg);
  }

  // ################################################
  // Private methods
  // ################################################

  _buildGetData(cfg) {
    let getData;
    if (isPlainObject(cfg instanceof pathDescriptor)) {
      // build reader from pathDescriptor
      getData = this._buildGetDataFromDescriptor(cfg);
    }
    else if (isFunction(cfg)) {
      // custom reader function
      getData = cfg;
    }
    this.getData = this._wrapAccessFunction(getData);
  }

  _buildGetDataFromDescriptor(pathDescriptor) {
    return function _getData(namedCalls, namedCallProxy, args, callerNode) {
      // // TODO check if all dependencies are loaded?
      // if (!callerNode.areDependenciesLoaded(this)) {
      //   return null;
      // }

      const pathOrPaths = pathDescriptor.getPath(namedCalls, namedCallProxy, args, callerNode);
      const { dataProvider } = callerNode;

      if (isArray(pathOrPaths)) {
        const paths = pathOrPaths;
        return paths.map(path => dataProvider.getData(path));
      }
      else {
        const path = pathOrPaths;
        return dataProvider.getData(path);
      }
    };
  }

  // ################################################
  // Public properties + methods
  // ################################################

  boundCall(namedCalls, namedCallProxy, args, callerNode) {
    // call path read function
    return this.getData(namedCalls, namedCallProxy, args, callerNode);
  }
}

function buildContextNodeBindings(dataContext, nodes) {

}

/**
 * Each DataContext has one DataContextBindings object each for: 
 * 1) paths, 2) reads + 3) writes.
 * 
 * DataContextBindings keeps track of the hierarchy, and provides the proxy objects
 * for all nodes in said tree.
 */
class DataContextTreeBindings {
  _dataContext;
  _tree;
  _rootNodeBindings;

  constructor(dataContext, tree) {
    this._dataContext = dataContext;
    this._tree = tree;

    autoBind(this);

    this._buildNodeBindings();
  }

  _buildNodeBindings() {
    this._rootNodeBindings = buildContextNodeBindings(this._dataContext, this._tree._roots);
  }
}


// TODO: let all data path/read/write nodes of the same name easily access each other

/**
 * The DataSourceNode provides di (dependency injection) through proxies and is at the core of the data model.
 * The node has access to all the named nodes that it's users could possibly make use of.
 * The node then uses the descriptor function while providing data from the bound data providers.
 */
class DataSourceNode {
  _dataContext;
  _dataProvider;
  _descriptor;
  _namedCallProxy;
  _namedCalls;
  _sourceNodesByName;

  constructor(dataContext, descriptorNode) {
    this._dataContext = dataContext;
    this._descriptor = descriptorNode;
    this._dataProvider = DataProviders[descriptorNode.dataProviderName];

    autoBind(this);

    this._buildProxies();
    this._buildChildBindings();
    
    console.assert(this._dataProvider);
  }

  // ################################################
  // Private methods
  // ################################################

  _buildProxies() {
    this._namedCalls = new Proxy(this, this._buildPassiveProxyHandler);
    this._namedCallProxy = new Proxy(this, this._buildActiveProxyHandler);
  }

  _buildPassiveProxyHandler() {
    return {
      get(target, name) {
        // resolve node and return call function to caller.
        // let caller decide when to make the actual call and which arguments to supply.
        const node = target.resolveName(name);
        return node.call;
      }
    };
  }

  _buildActiveProxyHandler() {
    return {
      get(target, name) {
        // resolve node and make call as soon as it's accessed
        const node = target.resolveName(name);
        return node.call();
      }
    };
  }

  _buildChildBindings() {
    // TODO
    this._sourceNodesByName = ;
  }


  // ################################################
  // Public properties + methods
  // ################################################

  get name() {
    return this._descriptor.name;
  }

  /**
   * Check if all dependencies are loaded
   * 
   * @param {*} args
   */
  areDependenciesLoaded(args) {
    // TODO: this is not done yet. 
    // TODO: We have to actually get the implicitly defined resources to figure this out.
    // TODO: knownDependencies currently only refers to explicitly sourced args

    // const knownDependencies = this._descriptor.getDependencies();
    // if (!isEmpty(knownDependencies)) {
    //   if (some(
    //     knownDependencies,
    //     sourceName => args[sourceName] !== null
    //   )) {
    //     return false;
    //   }
    // }

    return true;
  }

  // isNameLoaded(sourceName, args) {
  //   const node = this.resolveName(sourceName);
  //   if (!node) {
  //     throw new Error('invalid node name: ' + sourceName);
  //   }
  //   return !node.isDataLoaded(args);
  // }

  // /**
  //  * Check if data is loaded
  //  */
  // isDataLoaded(args) {
  //   // TODO: fix this!

  //   // 1) check if all dependencies are loaded
  //   if (!this.areDependenciesLoaded(args)) {
  //     return false;
  //   }

  //   // 2) check if actual target is also loaded
  //   const path = this._descriptor.getPath(args);
  //   return this.dataSource.isDataLoaded(path);
  // }

  resolveName(name) {
    const node = this.sourceNodesByName[name];
    if (!node) {
      throw new Error(`Requested name "${name}" does not exist in "${this.name}"`);
    }
    return node;
  }

  call(args) {
    args = args || EmptyObject;
    return this._descriptor.boundCall(this._namedCalls, this._namedCallProxy, args);
  }
}

/**
 * A DataContext represents a (more or less) global object responsible
 * for providing data read + write operations to any part of your app that
 * is bound to it. It also shares data bindings between all read + write operations
 * that are bound to it.
 * 
 * A DataContext can be used globally in an application, or
 * different parts of the app can use different DataContexts.
 */
class DataContext {
  /**
   * The data bindings for building paths
   */
  _pathBindings;

  /**
   * The data bindings for reading data
   */
  _readBindings;

  /**
   * The data bindings for writing data
   */
  _writeBindings;


  constructor(dataAccessCfg) {
    // TODO!
    this._buildDataSourceHierarchy(dataAccessCfg);
  }
  
  _buildDataSourceHierarchy() {
    return new Datasourcetre
  }

}

class ReactContextDataProvider extends DataProviderBase {
  // TODO: a data provider to read/write the local React context without it's usual shortcomings
  // TODO: proper pub-sub bindings
}

// ####################################################################################
// DataContextWrapper
// ####################################################################################

/**
 * Provide DataContext to @dataBind decorator
 * 
 * TODO: fix this mess
 */
class DataContextWrapper {
  dataContext;
  dataProxy;

  constructor(dataSource, onNewData) {
    this.dataContext = dataSource;
    this.onNewData = onNewData;


    autoBind(this);
  }

  accessDescriptorData(descriptor, args) {
    const path = descriptor.getPath(args);

    // whenever we access data, make sure, the path is registered
    this._registerPathListener(path);

    return this.dataContext.getData(path, args);
  }

  /**
   * Read data at given descriptor.
   * Also registers the listener for path, so changes to data at given path will stay in sync.
   * 
   * @param {string} pathDescriptorName 
   * @param {*} args 
   */
  accessData(pathDescriptorName, args) {
    const descriptor = this.pathDescriptorSet.getDescriptor(pathDescriptorName);
    //const { varNames } = getPath.pathInfo;

    if (descriptor) {
      return this.accessDescriptorData(descriptor, args);
    }
  }

  listenToPath(descriptorName, args) {
    if (!this.areDependenciesLoaded(descriptorName, args)) {
      // only start listening to a path when it's dependencies are fully resolved
      return;
    }

    const path = this.pathDescriptorSet.getPath(descriptorName, args);
    this._registerPathListener(path);
  }

  /**
   * Path descriptors provide the interface for accessing any backend data.
   * 
   * @param {*} pathDescriptorSet 
   */
  addPathDefinitions(pathDescriptorSet) {
    // return data at path of given path getter function, assuming that context props are already given
    this.pathDescriptorSet = pathDescriptorSet;
    Object.assign(this._isDataLoadedGetters,
      mapValues(
        pathDescriptorSet.pathDefinitions,
        this._createDataLoadedGetter
      )
    );
    Object.assign(this._dataGetters,
      mapValues(
        pathDescriptorSet.pathDescriptors,
        this._createDataGetter
      )
    );
  }

  _createDataLoadedGetter(descriptor, pathDescriptorName) {
    return (args) => this.isDataLoaded(pathDescriptorName, args);
  }

  _createDataGetter(descriptor) {
    return (args) => this.accessDescriptorData(descriptor, args);
  }

  _registerPathListener(path) {
    this.dataContext.registerListener(path, this);
  }

  /**
   * Internally used method when the component owning this data accessor is unmounted.
   */
  unmount() {
    this.dataContext.unregisterListener(this);
  }
}




// ####################################################################################
// React
// ####################################################################################


const dataBindScopeNamespace = '_dataBind_context';
const dataAccessNamespace = '_dataAccess';
const dataBindContextStructure = {
  [dataBindScopeNamespace]: PropTypes.object
};
const dataBindChildContextStructure = {
  [dataBindScopeNamespace]: PropTypes.object//.isRequired
};

function _getDataBindContextScope(context) {
  return context[dataBindScopeNamespace];
}


// TODO: Include dataSourceName in accessWrapper query
// TODO: Only require explicit dataSourceName when there is a naming ambiguity?!

// Future TODO: some dataSources should be hierarchical (e.g. Cache in front of DB)
//      Should dataSource hierarchy be configurable or hardcoded?
function _getDataAccessWrappersFromContext(context) {
  const scope = _getDataBindContextScope(context);
  return scope && scope[dataAccessNamespace];
}

function _buildDataAccessContext(accessWrappers) {
  return {
    [dataBindScopeNamespace]: {
      [dataAccessNamespace]: accessWrappers
    }
  };
}



function injectIntoClass(Clazz, methodName, methodWrapper) {
  Object.defineProperty(Clazz.prototype, methodName,
    {
      value: methodWrapper(Clazz.prototype[methodName])
    }
  );
}

/**
 * Note: This might behave differently for stateful and stateless components.
 * For stateless functions, pay attention to account for props and context 
 * in the `argsOrFunc` definition.
 * 
 * @see https://codepen.io/Domiii/pen/XejwKy?editors=0010
 * 
 * @param {*} Comp 
 * @param {*} argsOrFunc 
 * @return {Function} The modified component
 */
function injectRenderArgs(Comp, argsOrFunc) {
  const isComponent = Comp && Comp.prototype instanceof Component;

  // there is no good working heuristic to figure out if it's a function representing a component :(
  const isComponentFunction = isFunction(Comp);

  if (!isComponentFunction && !isComponent) {
    throw new Error('Tried to decorate object that is neither pure function nor component: ' + Comp);
  }

  function wrappedRender(origRender) {
    return (...origArgs) => {
      const props = this && this.props || origArgs[0];
      const newArgs = isFunction(argsOrFunc) ? argsOrFunc(...origArgs) : argsOrFunc;
      console.log('wrapped render: ' + props.name + `(${JSON.stringify(origArgs)}) → (${JSON.stringify(newArgs)})`);
      return origRender.call(this, ...newArgs);
    };
  }

  let ResultComp;
  if (isComponent) {
    injectIntoClass(Comp, 'render', wrappedRender);
    ResultComp = Comp;
  }
  else {
    ResultComp = wrappedRender(Comp);
  }

  return ResultComp;
}


const dataBind = (dataAccessCfgOrFunc) => _WrappedComponent => {
  class WrapperComponent extends Component {
    static contextTypes = dataBindContextStructure;
    static childContextTypes = dataBindChildContextStructure;

    shouldUpdate;
    dataAccessWrappers;
    pathDescriptorSet;

    constructor(props, context) {
      super(props, context);

      this.shouldUpdate = false;
      autoBind(this);

      // TODO: support multiple dataAccess objects?
      const accessCfg = isFunction(dataAccessCfgOrFunc) ||
        dataAccessCfgOrFunc(props, context) ||
        dataAccessCfgOrFunc;

      this.dataAccessWrappers = {};

      // TODO: Fix this total mess........
      forEach(accessCfg, (
        { source: sourceName, pathDefinitions },
        accessName
      ) => {
        const dataSource = DataSources[sourceName];
        if (!dataSource) {
          throw new Error('invalid data source name: ' + sourceName);
        }

        accessName = accessName || sourceName;

        // register new DataAccessWrapper
        const dataAccessWrapper =
          this.dataAccessWrappers[accessName] =
          new DataContextWrapper(dataSource, this._onNewData);

        const parentDataSet = _getDataAccessWrappersFromContext(context);
        const parentPathDescriptorSet = parentDataSet &&
          parentDataSet.pathDescriptorSet;

        this.pathDescriptorSet = new PathDescriptorSet(
          pathDefinitions,
          parentPathDescriptorSet,
          dataAccessWrapper.dataProxy
        );

        dataAccessWrapper.addPathDefinitions(this.pathDescriptorSet);
      });

      // TODO: we need a single dataProxy per data bound component?
      this.WrappedComponent = injectRenderArgs(_WrappedComponent,
        () => [this.dataProxy, this.props, this.context]);
    }

    getChildContext() {
      //console.log('getChildContext');
      return _buildDataAccessContext(this.dataAccessWrappers);
    }

    componentWillUpdate() {
    }

    shouldComponentUpdate() {
      // TODO: should it update?
      // (whenever any props, context, subscribed data in this or any child have changed)
      //return this.shouldUpdate;
      return true;
    }

    componentDidMount() {
      console.log('componentDidMount');

      this.shouldUpdate = true;
      this.forceUpdate();
    }

    componentWillUnmount() {
      this.shouldUpdate = true;
      forEach(this.dataAccessWrappers, wrapper => wrapper.unmount());
    }

    _onNewData(path, val) {
      this.shouldUpdate = true;
      this.forceUpdate();
      this.setState(EmptyObject);
    }

    render() {
      this.shouldUpdate = false;
      const { WrappedComponent } = this;
      return (<WrappedComponent {...this.props} data={this.data} />);
    }
  }

  return WrapperComponent;
};



function DataSourceRoot({ children }) {
  return Children.only(children);
}


// TODO: what to do with custom args?
function DataBind({ name, loading, args }, context) {
  const accessWrapper = _getDataAccessWrappersFromContext(context);

  console.log('DataBind.render: ' + name);

  if (!accessWrapper || !accessWrapper.isDataLoaded(name, args)) {
    const LoadIndicator = loading;
    accessWrapper && accessWrapper.listenToPath(name, args);
    return (<LoadIndicator />);
  }

  let val = accessWrapper.dataProxy[name];
  if (isObject(val)) {
    val = JSON.stringify(val, null, 2);
  }
  return (<span>{val}</span>);
}
DataBind.propTypes = {
  name: PropTypes.string.isRequired,
  args: PropTypes.object,
  loading: PropTypes.func
};
DataBind.contextTypes = dataBindContextStructure;

function Loading({ name, names, component, ...args }, context) {
  names = names || (name && [name]) || EmptyArray;
  const accessWrapper = _getDataAccessWrappersFromContext(context);
  const isLoading = some(names, name => accessWrapper.isDataLoaded(name));
  const Component = component || LoadIndicator;
  if (isLoading) {
    return (<Component {...args} />);
  }
  else {
    return (<span />); // empty element
  }
}
Loading.propTypes = {
  name: PropTypes.string,
  names: PropTypes.array,
  component: PropTypes.func
};
Loading.contextTypes = dataBindContextStructure;

function Loaded({ name, names, component, ...args }, context) {
  names = names || (name && [name]) || EmptyArray;
  const accessWrapper = _getDataAccessWrappersFromContext(context);
  const isLoading = some(names, name => accessWrapper.isDataLoaded(name));
  const Component = component;
  if (!isLoading) {
    return (<Component {...args} />);
  }
  else {
    return (<span />); // empty element
  }
}
Loaded.propTypes = {
  name: PropTypes.string,
  names: PropTypes.array,
  component: PropTypes.func.isRequired
};
Loaded.contextTypes = dataBindContextStructure;

function IfDataLoaded({ name, args, loading, loaded, loadingArgs, loadedArgs }, context) {
  const dataAccess = _getDataAccessWrappersFromContext(context);

  if (!dataAccess || !dataAccess.isDataLoaded(name, args)) {
    const Loading = loading;
    return <Loading {...loadingArgs} />;
  }
  const Loaded = loaded;
  return <Loaded {...loadedArgs} />;
}
IfDataLoaded.propTypes = {
  name: PropTypes.string.isRequired,
  args: PropTypes.object,
  loading: PropTypes.func,
  loaded: PropTypes.func,
  loadingArgs: PropTypes.object,
  loadedArgs: PropTypes.object
};
IfDataLoaded.contextTypes = dataBindContextStructure;



const dataAccessCfg = {
  auth: {
    dataProvider: 'firebaseAuth',
    children: {
      currentUser: '',
      currentUid: 'uid'
    }
  },
  db: {
    dataProvider: 'firebase',
    children: {
      uidsOfProject: '/_index/projectUsers/project/$(projectId)',
      projectIdsOfUser: '/_index/projectUsers/user/$(uid)',
      users: {
        path: '/users/public',
        children: {
          // TODO: get all users with role >= Roles.GM
          gms: { queryParams: ['orderByChild=role', `equalTo=${Roles.GM}`] },
          user: {
            path: '$(uid)'
            // ...
          }
        }
      },
      projects: {
        path: '/projects/list',
        children: {
          project: '$(projectId)'
        }
      },
      projectStages: {
        path: '/projectStages',
        children: {
          ofProject: {
            path: '$(projectId)',
            children: {
              list: {
                path: 'list',
                children: {
                  projectStage: {
                    path: '$(stageId)',
                    children: {
                      num: 'num',
                      status: 'status',
                      startTime: 'startTime',
                      finishTime: 'finishTime',
                      contributions: {
                        pathTemplate: 'contributions',
                        children: {
                          contribution: {
                            pathTemplate: '$(uid)',
                            children: {
                              contributorStatus: 'contributorStatus',
                              data: 'data'
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      missions: {
        path: '/missions',
        children: {
          mission: '$(missionId)'
        }
      }
    }
  }
};

// Data descriptor examples
//    "uid" -> "currentProjectIndices" -> "currentProjects" -> "currentProject" -> "projectStages" -> "stakeHolders" + "stakeHolderStatus"
const pathDescriptorTransformations = {
  projectsOfUser({ projectIdsOfUser, project }, { }, { uid }) {
    return map(projectIdsOfUser({ uid }) || EmptyObject, projectId => project({ projectId }));
  },

  usersOfProject({ uidsOfProject, user }, { }, { projectId }) {
    return map(uidsOfProject({ projectId }) || EmptyObject, uid => user({ uid }));
  },

  stageContributions({ projectStage }, { }, { projectId, stageId }) {
    const stage = projectStage({ projectId, stageId });
    return stage && stage.contributions;
  },

  stageContributors({ projectStage, stageContributorUserList },
    { },
    { projectId, stageId }) {
    const stage = projectStage({ projectId, stageId });
    const stageName = stage && stage.stageName;
    const node = stageName && ProjectStageTree.getNode(stageName);

    if (node && node.contributors) {
      const contributorDefinitions = map(node.contributors, contributorSet => {
        const { groupName } = contributorSet;
        const userList = stageContributorUserList({ projectId, groupName });
        return Object.assign({}, contributorSet, { userList });
      });
      return contributorDefinitions;
    }
    return null;
  },

  stageContributorUserList({ usersOfProject, projectReviewer, users: { gms } },
    { },
    { projectId, groupName }) {
    switch (groupName) {
      case 'gm':
        return gms();
      case 'party':
        return usersOfProject({ projectId });
      case 'reviewer':
        return projectReviewer({ projectId });
      default:
        console.error('invalid groupName in stage definition: ' + groupName);
        return EmptyObject;
    }
  }
};


const ProjectControlView = dataBind(dataAccessCfg)(
  () => {
    console.log('ProjectControlView.render');
    return (<div>
      <ProjectStagesView stageNode={ProjectStageTree.root} />)
      <p>
        uid:
        <DataBind name="uid" loading={LoadIndicator} />
      </p>
      <p>
        currentProjectId:
        <DataBind name="projectId" loading={LoadIndicator} />
      </p>
      <p>
        currentProject:
        {
          {/* map(projects, 
            (project, projectId) => 
          ) */}
        }
        <DataBind name="project" loading={LoadIndicator} />
      </p>
    </div>);
  }
);
export default ProjectControlView;
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


// TODO: STICK TO FIREBASE SYNTAX, DON'T OVER-GENERALIZE!

/**
 * A parsed "dataConfig" object.
 * Allows composing of local descriptors built from descriptors imported from other places.
 */
class DataDescriptionNode {
  dataProviderName;

  constructor(dataProviderName, dataConfig) {
    // TODO: parse data config object as shown below.
    // TODO: can also be used to be exported and added into other dataConfigs
    // TODO: more...
    //  1) allow for RefWrapper-type config parsing, with pathTemplate also to be called "path" + advanced features
    //  2) handle + properly name node types: PathDescriptor (path string + fn), reader (fn), writer (fn).
    //  3) merge all nodes back into all ascendants when not ambiguous.
    //    Note: if name is on this node, and the same name is used down the line, add the descriptor from "this node"
    //    Note: in all other cases of ambiguity, insert "ambiguous error" descriptor
  }
}

// TODO: use DataDescriptionNode to build readers and writers

class DataReader {
  pathDescriptor;
  
  constructor(dataDescriptionNode) {
    // TODO: Handle pathDescriptor returning multiple paths
  }
}

class DataWriter {
  pathDescriptor;

  constructor(dataDescriptionNode) {
    // TODO: Handle pathDescriptor returning multiple paths
    // TODO: Just implement the previous writes as is, for now!
  }
}

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

/**
 * TODO: Rename to DataSource (one node as part of hierarchy)
 */
class DataAccessWrapper {
  dataSource;
  pathDescriptorSet;
  dataProxy;

  constructor(dataSource, onNewData) {
    this.dataSource = dataSource;
    this.onNewData = onNewData;

    this._dataGetters = {};

    this.buildDataReadProxy();

    autoBind(this);
  }
  

  // TODO: Let's redo this whole thing!!!
  buildDataReadProxy(dataSource) {
    // Note: only functions that do not have dependencies on local arguments can succeed
    // const p = new Proxy(dataSource);
    // return p;
    
    this.dataProxy = new Proxy(this._dataGetters, {
      get: (target, name) => {
        const f = target[name];
        if (!f) {
          console.warn('Invalid data access. Name is not registered: ' + name);
          return null;
        }
        else {
          return f();
        }
      }
    });
  }

  /**
   * Check if all dependencies are loaded
   * 
   * @param {*} descriptorOrName
   * @param {*} args
   */
  areDependenciesLoaded(descriptorOrName, args) {
    let descriptor;
    if (isString(descriptorOrName)) {
      descriptor = this.pathDescriptorSet.getDescriptor(descriptorOrName);
      if (!descriptor) {
        return false;
      }
    }
    else {
      descriptor = descriptorOrName;
    }

    const { varNames } = descriptor.pathInfo;
    if (!isEmpty(varNames)) {
      if (some(
        varNames,
        argName => !this.isDataLoaded(argName, args))
      ) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if data is loaded
   * 
   * @param {*} pathDescriptorName
   * @param {*} args
   */
  isDataLoaded(pathDescriptorName, args) {
    // 1) check if all dependencies are loaded
    if (!this.areDependenciesLoaded(pathDescriptorName, args)) {
      return false;
    }

    // 2) check if actual target is also loaded
    const descriptor = this.pathDescriptorSet.getDescriptor(pathDescriptorName);
    if (descriptor) {
      const path = descriptor.getPath(args);
      return this.dataSource.isDataLoaded(path);
    }
    return false;
  }

  /**
   * Read data at given descriptor.
   * No side-effects.
   * 
   * @param {*} pathDescriptorName 
   * @param {*} args 
   */
  getData(pathDescriptorName, args) {
    // 1) check if all dependencies are loaded
    if (!this.areDependenciesLoaded(pathDescriptorName, args)) {
      return null;
    }

    // 2) try getting the data
    const path = this.pathDescriptorSet.getPath(pathDescriptorName, args);
    return this.dataSource.getData(path);
  }

  accessDescriptorData(descriptor, args) {
    const path = descriptor.getPath(args);

    // whenever we access data, make sure, the path is registered
    this._registerPathListener(path);

    return this.dataSource.getData(path, args);
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
    this.dataSource.registerListener(path, this);
  }

  /**
   * Internally used method when the component owning this data accessor is unmounted.
   */
  unmount() {
    this.dataSource.unregisterListener(this);
  }
}

/**
 * DataDescriptor functions have four arguments:
 * 
 * @param {object} descriptors set of path/data descriptors
 * @param {object} injectedData set of injected data, interpolated from data descriptors of given names
 * @param {object} args set of arguments, required to be supplied explicitly.
 * 
 * When DataDescriptors are executed the first time in data-bound context, all accessed paths are
 * added as dependencies and their loading initialized.
 * 
 * When a descriptor is called:
 * 1) All injected data is automatically added to data dependencies immediately.
 * 2) descriptor arguments are NOT added immediately, only after they are called.
 * 
 * @return {object or array} Returns one or more sets of data or paths
 */
class PathDescriptor {
  _pathConfig;
  _pathGetter;
  _pathInfo;

  constructor(pathConfig) {
    this._pathConfig = pathConfig;

    this.buildPathGetter(pathConfig);

    autoBind(this);
  }

  // TODO: fix this!
  buildPathGetter(pathConfig, dataSource) {
    if (isString(pathConfig)) {
      // TODO
      const lookupPath = createPathGetterFromTemplateProps(pathConfig);
      this._pathInfo = lookupPath.pathInfo;
    }
    else if (isPlainObject(pathConfig)) {
      // TODO
    }
    else if (isFunction(pathConfig)) {
    }
    this._pathGetter = args => lookupPath(this._mapArgs(args));
  }

  getPath(dataSourceHierarchy, args) {
    // call a data read function
    return this._pathGetter(dataSourceHierarchy, dataSourceHierarchy.dataProxy, args);
  }

  get pathInfo() {
    return this._pathInfo;
  }

  _mapVar(inputName) {
    return this._dataProxy[inputName]();
  }
}


function _makePathDescriptors(pathDefinitions, dataProxy) {
  const descriptors = mapValues(
    pathDefinitions,
    def => new PathDescriptor(def, dataProxy));

  // TODO: make sure there are no cycles in dependency graph to avoid infinite loops

  return descriptors;
}

/**
 * Used to maintain a hierarchical set of path descriptors (aliases).
 * TODO: Better separation of concerns: Don't feed data proxy back into PathDescriptorSet.
 */
class PathDescriptorSet {
  parent;
  pathDescriptors;

  constructor(pathDefinitions, parent, dataProxy) {
    this.parent = parent;

    const pathDescriptors = _makePathDescriptors(pathDefinitions, dataProxy);
    const parentDescriptors = parent && parent.pathDescriptors || EmptyObject;
    this.pathDescriptors = Object.assign(pathDescriptors, parentDescriptors);
  }

  getDescriptor(pathDescriptorName) {
    return this.pathDescriptors[pathDescriptorName];
  }

  getPath(pathDescriptorName, args) {
    const descriptor = this.pathDescriptors[pathDescriptorName];
    if (!!descriptor) {
      return descriptor.getPath(args);
    }
    else {
      console.error('unknown pathDescriptorName: ' + pathDescriptorName);
      return null;
    }
  }
}


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
          new DataAccessWrapper(dataSource, this._onNewData);

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
    source: 'firebaseAuth',
    children: {
      currentUser: '',
      currentUid: 'uid'
    }
  },
  db: {
    source: 'firebase',
    children: {
      uidsOfProject: '/_index/projectUsers/project/$(projectId)',
      projectIdsOfUser: '/_index/projectUsers/user/$(uid)',
      users: {
        path: '/users/public',
        children: {
          // TODO: get all users with role >= Roles.GM
          gms: `?orderByChild=role&equalTo=${Roles.GM}`,
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
                  stage: {
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

  projectStage({ projectStages: stage }, { }, { projectId, stageId }) {
    return stage({ projectId, stageId });
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
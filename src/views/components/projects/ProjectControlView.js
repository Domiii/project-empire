import {
  ProjectStageTree,
  StageStatus
} from 'src/core/projects/ProjectDef';

import autoBind from 'src/util/auto-bind';
import { EmptyObject, EmptyArray } from 'src/util';

import map from 'lodash/map';
import isString from 'lodash/isString';
import isFunction from 'lodash/isFunction';
import isEmpty from 'lodash/isEmpty';
import isObject from 'lodash/isObject';
import mapValues from 'lodash/mapValues';
import filter from 'lodash/filter';
import flatMap from 'lodash/flatMap';
import some from 'lodash/some';

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
import Loading from 'src/views/components/util/loading';


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
function StageStatusBar({ stageNode }) {
  const stageContributors = getStageContributors(stageNode);
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
}
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


// TODO: "context-sensitive path aliases" (such as currentProjectId)
// TODO: Automatically registering paths for "context-sensitive path aliases"
// TODO: E.g. `currentProject` is a mapping from inputs to outputs (e.g. `currentProjectId` becoming `projectId` for pathLookup.project)
// TODO: pathLookup only relevant in a subtree
// TODO: All kinds of "aside" data (like "partyMembers") does not need to be real-time updated (for now)
//    -> Consider a priority flag to indicate whether data should always be real-time, or whether some data can be outdated

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
      byPath.forEach((_, path) => this.unregisterListenerPath(path, listener));
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

  // Any DataProvider needs to implement the following three methods:

  onListenerAdd(path, listener) {
    throw new Error('DataProvider did not implement `onListenerAdd` method');
  }

  onListenerRemove(path, listener) {
    throw new Error('DataProvider did not implement `onListenerRemove` method');
  }

  notifyNewData(path, val) {
    const listeners = this.getListeners(path) || EmptyArray;
    listeners.forEach(listener => listener.onNewData(path, val));
  }

  getData(path) {
    throw new Error('DataProvider did not implement `getData` method');
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

    setTimeout(() => this.notifyNewData(path, val));
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
    this.pathListeners[path] = null;
  }

  isDataLoaded(path) {
    return this.getData(path) !== undefined;
  }

  getData(path) {
    return getDataIn(this.firebaseCache, path, undefined);
  }
}
const defaultDataProvider = new FirebaseDataProvider();


// TODO: Work on ContextDataProvider
// TODO: Define ContextDataProvider details through the PathDescriptorSet definition
// TODO: How to access different dataProviders?

// TODO: Use the same concept to also create a WebCacheDataProvider.

class DataAccess {
  dataProvider;
  pathDescriptorSet;
  dataProxy;

  constructor(dataProvider, onNewData) {
    this.dataProvider = dataProvider;
    this.onNewData = onNewData;

    this._dataGetters = {};
    this._isDataLoadedGetters = {};
    
    this.isDataLoadedProxy = new Proxy(this._isDataLoadedGetters, {
      get: (target, name) => {
        const f = target[name];
        if (!f) {
          console.warn('Invalid data access. Name is not registered: ' + name);
          return null;
        }
        else {
          // TODO: custom args?
          return f();
        }
      }
    });
    
    this.dataProxy = new Proxy(this._dataGetters, {
      get: (target, name) => {
        const f = target[name];
        if (!f) {
          console.warn('Invalid data access. Name is not registered: ' + name);
          return null;
        }
        else {
          // TODO: custom args?
          return f();
        }
      }
    });

    autoBind(this);
  }

  /**
   * Check if all dependencies are loaded
   * 
   * @param {*} pathDescriptorName
   * @param {*} args
   */
  areDependenciesLoaded(descriptor, args) {
    if (isString(descriptor)) {
      descriptor = this.pathDescriptorSet.getDescriptor(descriptor);
      if (!descriptor) {
        return false;
      }
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
      return this.dataProvider.isDataLoaded(path);
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
    return this.dataProvider.getData(path);
  }

  accessDescriptorData(descriptor, args) {
    const path = descriptor.getPath(args);

    // whenever we access data, make sure, the path is registered
    this._registerPathListener(path);
    
    return this.dataProvider.getData(path, args);
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
    this.dataProvider.registerListener(path, this);
  }

  /**
   * Internally used method when the component owning this data accessor is unmounted.
   */
  unmount() {
    this.dataProvider.unregisterListener(this);
  }
}

/**
 * 
 */
class PathDescriptor {
  _pathTemplate;
  _pathGetter;
  _dataProxy;
  _pathInfo;

  constructor(pathTemplate, dataProxy) {
    this._pathTemplate = pathTemplate;
    this._dataProxy = dataProxy;
    // this._pathGetter = createPathGetterFromTemplateProps(pathTemplate, _varContextMap && 
    //   this._varTransform.bind(this) || 
    //   null);

    const lookupPath = createPathGetterFromTemplateProps(pathTemplate);
    this._pathInfo = lookupPath.pathInfo;

    // lookup variables
    this._pathGetter = args => lookupPath(this._mapArgs(args));

    autoBind(this);
  }

  get pathInfo() {
    return this._pathInfo;
  }

  getPath(args) {
    return this._pathGetter(args);
  }

  _mapArgs(args) {
    // lookup data from dataProxy
    if (args === undefined) {
      // minor optimization: Don't create new object if no args given
      args = this._dataProxy;
    }
    else {
      args = Object.assign({}, this._dataProxy, args);
    }
    return args;
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
const dataAccessName = '_dataAccess';
const dataBindContextStructure = {
  [dataBindScopeNamespace]: PropTypes.object
};
const dataBindChildContextStructure = {
  [dataBindScopeNamespace]: PropTypes.object//.isRequired
};

function _getDataBindContextScope(context) {
  return context[dataBindScopeNamespace];
}

function _getDataAccessFromContext(context) {
  const scope = _getDataBindContextScope(context);
  return scope && scope[dataAccessName];
}

function _buildDataAccessContext(dataAccess) {
  return {
    [dataBindScopeNamespace]: { 
      [dataAccessName]: dataAccess
    }
  };
}

const dataBind = (projectPathsOrFun) => WrappedComponent => {
  const dataProvider = defaultDataProvider;

  class WrapperComponent extends Component {
    static contextTypes = dataBindContextStructure;
    static childContextTypes = dataBindChildContextStructure;

    dataAccess;
    pathDescriptorSet;

    constructor(...args) {
      super(...args);
      
      autoBind(this);
    }

    getChildContext() {
      //console.log('getChildContext');
      return _buildDataAccessContext(this.dataAccess);
    }

    componentWillUpdate() {
    }

    shouldComponentUpdate() {
      // TODO: should it update? 
      // (whenever any subscribed state in this or any child has changed)
      return true;
    }

    componentDidMount() {
      console.log('componentDidMount');
      this.dataAccess = new DataAccess(dataProvider, this._onNewData);

      const parentDataSet = _getDataAccessFromContext(this.context);
      const parentPathDescriptorSet = parentDataSet && parentDataSet.pathDescriptorSet;
      const projectPaths = isFunction(projectPathsOrFun) ||
        projectPathsOrFun || 
        EmptyObject;
      this.pathDescriptorSet = new PathDescriptorSet(
        projectPaths, parentPathDescriptorSet, this.dataAccess.dataProxy);

      this.dataAccess.addPathDefinitions(this.pathDescriptorSet);
    }

    componentWillUnmount() {
      this.dataAccess && this.dataAccess.unmount();
    }

    _onNewData(path, val) {
      this.forceUpdate();
      this.setState(EmptyObject);
    }

    render() {
      return (<WrappedComponent data={this.data} />);
    }
  }
  return WrapperComponent;
};

// setTimeout(() => {
//   registerListener('test/1');
//   registerListener('test/1/b');
// }, 100);



function DataProviderRoot({ children }) {
  return Children.only(children);
}


function DataBind({ name, loading, args }, context) {
  // TODO: what to do with custom args?
  const dataAccess = _getDataAccessFromContext(context);
  
  console.log('DataBind: ' + name);

  if (!dataAccess || !dataAccess.isDataLoaded(name, args)) {
    const Loading = loading;
    dataAccess && dataAccess.listenToPath(name, args);
    return (<Loading />);
  }

  let val = dataAccess.dataProxy[name];
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

function IfDataLoaded({name, args, loading, loaded, loadingArgs, loadedArgs}, context) {
  const dataAccess = _getDataAccessFromContext(context);
  
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


// TODO: handle multiple data providers nice and gracefully!
// TODO: need a way to figure out if data is still loading?

// create path getter functions
const projectPaths = {
  // // TODO: use explicit index system to create paths for this
  // // TODO: somehow provide the currentUserId as argument
  // currentUserProjectIds: ,
  
  // // TODO: Use currentUserProjectIds as input feed for this
  // currentUserProjects: ???,

  // // TODO: easy enough
  // currentProjectStages: ???,

  // TODO: this is only relevant to children created from set of stages
  currentProjectId: '/projects/currentProjectId',

  //project: createPathGetterFromTemplateArray('/project/$(projectId)')
  currentProject: '/projects/list/$(currentProjectId)'
};

const ProjectControlView = dataBind(projectPaths)(() => {
  console.log('ProjectControlView.render');
  //<ProjectStagesView stageNode={ProjectStageTree.root} />
  return (<div>
    <p>
      currentProjectId: <DataBind name="currentProjectId" loading={Loading} />
    </p>
    <p>
      currentProject: <DataBind name="currentProject" loading={Loading} />
    </p>
  </div>);
});
export default ProjectControlView;
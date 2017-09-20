import {
  ProjectStageTree,
  StageStatus
} from 'src/core/projects/ProjectDef';

import autoBind from 'src/util/auto-bind';
import { EmptyObject, EmptyArray } from 'src/util';

import map from 'lodash/map';
import mapValues from 'lodash/mapValues';
import filter from 'lodash/filter';
import flatMap from 'lodash/flatMap';

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


// TODO: Hook up to db
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
  createPathGetterFromTemplateArray,

  getDataIn,
  setDataIn
} from 'src/firebaseUtil/dataUtil';

// Q: How to get access to "currentUserUid", "currentProject", "currentStage", "nextStage"?
// A: using pathTemplate definitions as usual
// TODO: More light-weight approach to getting data than previous RefWrapper object

// TODO: Need to wrap App in new data handler if we don't want to use redux
// TODO: use special path in childContext to manage "ids" for children
// TODO: how to bind path variables from context to getData functions?

// TODO: All kinds of "aside" data (like "partyMembers") does not need to be real-time updated (for now)
//    -> Consider a priority flag to indicate whether data should always be real-time, or whether some data can be outdated



// TODO: "context-sensitive path aliases" (such as currentProjectId)
// TODO: Automatically registering paths for "context-sensitive path aliases"
// TODO: E.g. `currentProject` is a mapping from inputs to outputs (e.g. `currentProjectId` becoming `projectId` for pathLookup.project)
// TODO: pathLookup only relevant in a subtree

class DataProviderBase {
  listenersByPath = {};

  registerListener(path, listener) {
    const listeners = this.listenersByPath[path];
    if (!listeners) {
      // first time, anyone is showing interest in this path
      listeners = new Set();
      console.log('registered path: ', path);
    }
    if (!listeners.has(listener)) {
      // add listener to set
      listeners.add(listener);
      this.onListenerAdd(path, listener);
    }
  }

  unregisterListener(path, listener) {
    const listeners = this.listenersByPath[path];
    console.assert(listeners);

    listeners.delete(listener);

    this.onListenerRemove(path, listener);
  }

  // Any DataProvider needs to implement the following three methods:

  onListenerAdd(path, dataAccess) {
    throw new Error('DataProvider did not implement `onNewAdd` method');
  }

  onListenerRemove(path, dataAccess) {
    throw new Error('DataProvider did not implement `onListenerRemove` method');
  }

  getData() {
    throw new Error('DataProvider did not implement `getData` method');
  }
}

class FirebaseDataProvider extends DataProviderBase {
  firebaseCache = {};

  constructor() {
    super();

    autoBind(this);
  }

  _onNewData(snap) {
    const val = snap.val();
    console.log('R[', path, '] ', val);
    setDataIn(this.firebaseCache, path, val);

    listeners.forEach(listener => listener.onNewData(path, val));
  }

  _onError(err){
    console.error(err.stack);
  }

  onListenerAdd(path, dataAccess) {
    const fb = getFirebase();
    fb.database().ref(path).on('value', this._onNewData, this._onError);
  }

  onListenerRemove(path, dataAccess) {
    const fb = getFirebase();
    fb.database().ref(path).off('value');
  }

  getData(path) {
    return getDataIn(this.firebaseCache, path);
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
  dataAccessors;
  ownPaths = new Set();

  constructor(dataProvider, props) {
    this.dataProvider = dataProvider;
    this.props = props;
  }

  /**
   * Read data at given descriptor.
   * No side-effects.
   * 
   * @param {*} pathDescriptorName 
   * @param {*} args 
   */
  getData(pathDescriptorName, args) {
    const getPath = this.pathDescriptorSet.getPath(pathDescriptorName, args);
    //const { varNames } = getPath.pathInfo;

    if (getPath) {
      // whenever we access data, make sure, the path is registered
      const path = getPath(args);
      return this.dataProvider.getData(path);
    }
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

  accessDescriptorData(descriptor, args) {
    // whenever we access data, make sure, the path is registered
    const getPath = descriptor.getPath(args);
    const path = getPath(args);
    this._registerPathListener(path);
    return this.dataProvider.getData(path);
  }
  
  _createDataGetter(descriptor) {
    return (args) => this.accessDescriptorData(descriptor.getPath(args));
  }

  /**
   * Path descriptors provide the interface for accessing any backend data.
   * 
   * @param {*} pathDescriptorSet 
   */
  createDataProxy(pathDescriptorSet) {
    // return data at path of given path getter function, assuming that context props are already given
    this.pathDescriptorSet = pathDescriptorSet;
    return this.dataAccessors = new Proxy(
      mapValues(pathDescriptorSet.pathDescriptors, descriptor => this._createDataGetter(descriptor)),
      {
        get: (target, name) => {
          const descriptor = target[name];
          if (!f) {
            console.warning('invalid pathDescriptor is not registered: ' + name);
            return null;
          }
          else {
            // TODO: custom args?
            f();
          }
        }
      }
    );
  }

  _registerPathListener(path) {
    if (this.ownPaths.has(path)) {
      return;
    }
    this.ownPaths.add(path);

    // TODO: connect to listener callback from `dataBound` component

    this.dataProvider.registerListener(path, this);
  }

  /**
   * Internally used method when the component owning this data accessor is unmounted.
   */
  _unmount() {
    this.ownPaths.forEach(path => this.dataProvider.unregisterListener(path, this));
  }
}

/**
 * 
 */
class PathDescriptor {
  _pathTemplate;
  _pathGetter;
  _dataProxy;

  constructor(pathTemplate, dataProxy) {
    this._pathTemplate = pathTemplate;
    this._dataProxy = dataProxy;
    // this._pathGetter = createPathGetterFromTemplateProps(pathTemplate, _varContextMap && 
    //   this._varTransform.bind(this) || 
    //   null);

    const lookupPath = createPathGetterFromTemplateProps(pathTemplate);

    if (dataProxy) {
      // lookup variables
      this._pathGetter = args => lookupPath(this._mapVars(args));
    }
    else {
      this._pathGetter = lookupPath;
    }

    autoBind(this);
  }

  getPath(args) {
    return this._pathGetter(args);
  }

  _mapVars(args) {
    // lookup data from dataProxy
    if (args === undefined) {
      // minor optimization: Don't create new object if no args given
      return this._dataProxy;
    }
    return Object.assign({}, this._dataProxy, args);
  }

  _mapVar(inputName) {
    return this._dataProxy[inputName]();
  }
}

/**
 * Used to maintain a hierarchical set of path descriptors (aliases).
 * TODO: Better separation of concerns: Don't feed data proxy back into PathDescriptorSet.
 */
class PathDescriptorSet {
  parent;
  pathDescriptors;

  constructor(pathDescriptors, parent) {
    this.parent = parent;

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

// TODO: be able to access the different providers somehow
// TODO: Especially the default db + the local context providers

// create path getter functions
const pathLookup = {
  // TODO: use explicit index system to create paths for this
  // TODO: somehow provide the currentUserId as argument
  currentUserProjectIds: ,
  
  // TODO: Use currentUserProjectIds as input feed for this
  currentUserProjects: ???,

  // TODO: easy enough
  currentProjectStages: ???,

  // TODO: this is only relevant to children created from set of stages
  currentProjectStage: ???,

  //project: createPathGetterFromTemplateArray('/project/$(projectId)')
  project: createPathGetterFromTemplateProps('/project/$(projectId)')
};


// TODO: need a way to figure out if data is still loading?
const dataBindScopeNamespace = '_dataBind_context';
const dataBindAccessName = '_dataAccess';

function _getDataAccess(context) {
  const scope = context[dataBindScopeNamespace];
  return scope && scope[dataBindAccessName];
}

function DataBind({ name, ...args }, context) {
  // TODO: what to do with custom args?
  const dataAccess = _getDataAccess(context);
  return dataAccess.dataAccess[name];
}

const dataBind = (pathLookup, dataProvider) => WrappedComponent => {
  dataProvider = dataProvider || defaultDataProvider;

  class WrapperComponent extends Component {
    dataAccess;
    pathDescriptorSet;

    constructor(...args) {
      super(...args);
    }

    // TODO: call forceUpdate when new data arrived

    componentWillMount() {
    }

    componentWillUpdate() {
      // TODO: Update all changed path descriptors (from parent, as well as from pathLookup arguments)
    }

    get data() {
      return this.dataAccess.dataAccessors;
    }

    render() {
      return (<WrappedComponent {...this.props} />);
    }

    shouldComponentUpdate() {
      // TODO: should it update?
      return true;
    }

    componentDidMount() {
      // TODO make correct use of context. Define childContextBlablas...

      const parentDataSet = _getDataAccess(this.context);
      const parentPathDescriptorSet = parentDataSet.pathDescriptorSet;

      this.pathDescriptorSet = new PathDescriptorSet(pathLookup, parentPathDescriptorSet);

      this.dataAccess = new DataAccess(dataProvider);
      this.dataAccess.createDataProxy(this.pathDescriptorSet);
    }

    componentWillUnmount() {
      this.dataAccess.unmount();
    }
  }
  return WrapperComponent;
};

// setTimeout(() => {
//   registerListener('test/1');
//   registerListener('test/1/b');
// }, 100);



// TODO: provide data to all
function DataProviderRoot({ children }) {
  return Children.only(children);
}


@dataBind((pathLookup) => {
  return {

  };
})
class Test extends Component {
  render() {
    return (<div>hi</div>);
  }
}

export default class ProjectControlView extends Component {
  render() {
    console.log('ProjectControlView.render');
    return (
      //<ProjectStagesView stageNode={ProjectStageTree.root} />
      <Test />
    );
  }
}
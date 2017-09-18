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

function StageContributorIcon({user, status, groupName}) {
  // TODO: groupName classes
  const classes = 'project-contributor project-contributor-' + groupName;
  return (
    <div className={classes} style={{backgroundImage: 'url(' + user.photoURL + ')'}}>
      { status && 
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
function StageStatusBar({stageNode}) {
  const stageContributors = getStageContributors(stageNode);
  //return (<StageStatusIcon status={status} />);
  return (<div>
    { map(stageContributors, user =>
      <StageContributorIcon 
        groupName={'???'}
        user={user}
        status={getStageContributorStatus(user, stageNode)}
      /> )
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
    array.length -1 !== index  // insert new object only if not already at the end
    ? [value, cb(value, arr[index+1], index)]
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

export function ProjectStageView({stageNode}) {
  const stageDef = stageNode.stageDef;
  const title = stageDef.title;

  const order = stageNode.order;
  const status = getStageStatus(stageNode);
  const bsStyle = statusBsStyles[status];

  const header = (
    <Flex row justifyContent="space-between" alignItems="center">
      <Item>
        <span>{`${order+1}. ${title}`}</span>
      </Item>
      <Item>
        <StageStatusBar stageNode={stageNode} />
      </Item>
    </Flex>
  );

  return (<div>
    <Panel header={header} className="no-margin no-shadow no-border project-stage-panel"
      bsStyle={bsStyle}>
      { stageNode.firstChild && (
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

function ProjectStageArrow({previousNode}) {
  const status = getStageStatus(previousNode);
  const style = statusStyles[status];
  return (<FAIcon name="arrow-down" size="4em" style={style} />);
}
ProjectStageArrow.propTypes = {
  previousNode: PropTypes.object.isRequired
};

export function ProjectStagesView({stageNode}) {
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
            { !!node.next && 
              <Item style={{display: 'flex'}} justifyContent="center" flex="1" >
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

class FirebaseDataProvider {
  activePaths = {};
  firebaseCache = {};
  listeners = new Set();

  constructor() {
    autoBind(this);
  }

  _onNewData(snap) {
    const val = snap.val();
    console.log(path, ': ', val);
    setDataIn(this.firebaseCache, path, val);

    listeners.forEach(listener => listener.onNewData(path, val));
  }
  
  registerListener(path, dataAccess) {
    if (!this.activePaths[path]) {
      this.listeners.add(dataAccess);
      
      console.log('registered path: ', path);

      const fb = getFirebase();
      fb.database().ref(path).on('value', this._onNewData, err => console.error(err.stack));
    }
    this.activePaths[path] = (this.activePaths[path] || 0) + 1;
  }

  unregisterListener(path, dataAccess) {
    console.assert(this.activePaths[path] > 0);
    this.listeners.delete(dataAccess);

    this.activePaths[path] = this.activePaths[path] - 1;
    const fb = getFirebase();
    fb.database().ref(path).off('value');
  }
  
  getData(path) {
    return getDataIn(this.firebaseCache, path);
  }
}
const defaultDataProvider = new FirebaseDataProvider();


class DataAccess {
  dataProvider;
  dataAccessors;
  props;
  ownPaths = new Set();

  constructor(dataProvider, props) {
    this.dataProvider = dataProvider;
    this.props = props;
  }
  
  createDataGetter(getPath) {
    return (...args) => this.getData(getPath(...args));
  }

  getData(path) {
    // whenever we get data, make sure, the path is registered
    this.registerPath(path);
    return this.dataProvider.getData(path);
  }
  
  registerPath(path) {
    if (this.ownPaths.has(path)) {
      return;
    }
    this.ownPaths.add(path);
    this.dataProvider.registerListener(path);
  }

  registerPathDescriptors(pathDescriptorSet) {
    // return data at path of given path getter function, assuming that context props are already given
    this.dataAccessors = new Proxy(
      mapValues(pathDescriptorSet.pathGetters, getPath => this.createDataGetter(getPath)), 
      {
        get: (target, name) => {
          const f = target[name];
          if (!f) {
            console.warning('invalid data name does not exist: ' + name);
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

  unmount() {
    this.ownPaths.forEach(path => this.dataProvider.unregisterListener(path, this));
  }

  getData(alias) {
    const getPath = this.pathLookup[alias];

    if (getPath) {
      const { varNames } = getPath.pathInfo;

    }
    else {
      console.error('data alias not recognized: ' + alias);
    }
  }
}

/**
 * `varContextMap` example: { currentUid: someFunction() {...} }
 */
class PathDescriptor {
  _pathTemplate;
  _pathGetter;
  _varContextMap;

  constructor(pathTemplate, varContextMap) {
    this._pathTemplate = pathTemplate;
    this._varContextMap = varContextMap;
    // this._pathGetter = createPathGetterFromTemplateProps(pathTemplate, _varContextMap && 
    //   this._varTransform.bind(this) || 
    //   null);

    const lookupPath = createPathGetterFromTemplateProps(pathTemplate);

    if (varContextMap) {
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
    // lookup data from varContextMap
    return Object.assign({}, mapValues(this.varContextMap, getData => getData()), args);
  }

  _mapVar(inputName) {
    return this._varContextMap[inputName]();
  }
}

/**
 * Used to maintain a hierarchical set of path descriptors (aliases).
 */
class PathDescriptorSet {
  parent;
  pathDescriptors;
  pathGetters;

  constructor(pathLookup, parent) {
    // TODO
    const pathGetters = ??;
    this.pathGetters = Object.assign(pathGetters, parent && parent.pathGetters || EmptyObject);
  }

}

// TODO: get DataAccess ready

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

function DataBind({name, ...args}) {
  // TODO: Get dataAccess object from context
  // TODO: what to do with custom args?
  const dataAccess = ???;
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
      // TODO: get parent path descriptors from context? (but cannot get in constructor)
      const parentPathDescriptorSet = ???;

      this.pathDescriptorSet = new PathDescriptorSet(pathLookup, parentPathDescriptorSet);

      this.dataAccess = new DataAccess(dataProvider);
      this.dataAccess.registerPathDescriptors(this.pathDescriptorSet);
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
      // TODO:
    }

    componentDidMount() {
      //this.newProps = transformationFunc(this.props);
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
function DataProviderRoot({children}) {
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
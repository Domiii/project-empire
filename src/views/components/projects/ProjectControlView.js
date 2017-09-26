import Roles from 'src/core/users/Roles';

import {
  ProjectStageTree,
  StageStatus
} from 'src/core/projects/ProjectDef';

import autoBind from 'src/util/auto-bind';
import { EmptyObject, EmptyArray } from 'src/util';

import map from 'lodash/map';
import forEach from 'lodash/forEach';

import React, { Component, Children } from 'react';
import PropTypes from 'prop-types';
import { Flex, Item } from 'react-flex';

import {
  Panel, Button, Alert, Well
} from 'react-bootstrap';

import dataBind from 'src/dbdi/react/dataBind';

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

const StageContributorIcons = dataBind()(
  ({ }, { }) => {

  }
);

// Render icon + status of all responsible contributors for given stage

const StageStatusBar = dataBind()(
  ({ stageNode, stageContributors }, { }) => {
    //return (<StageStatusIcon status={status} />);
    return (<div>
      {map(stageContributors, user =>
        <StageContributorIcons
          user={user}
          status={getStageContributorStatus(user, stageNode)}
        />)
      }
    </div>);
  }
);
StageStatusBar.propTypes = {
  stageNode: PropTypes.object.isRequired
};



// ####################################################
// Project tree + stage logic
// ####################################################


// TODO: ProjectsRef, ProjectStagesRef, MissionsRef, UserInfoRef

const ProjectStageView = dataBind()(
  ({ stageNode }, { }) => {
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
);
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

const ProjectStagesView = dataBind()(
  ({ thisProjectStages, stageNode }, { }) => {
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
);
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


/**
 * Provide DataSource to @dataBind decorator
 * 
 * TODO: fix this mess
 */
class DataSourceWrapper {
  _dataSource;
  _dataProxy;

  constructor(dataSource, onNewData) {
    this._dataSource = dataSource;
    this.onNewData = onNewData;

    autoBind(this);
  }

  accessDescriptorData(descriptor, args) {
    const path = descriptor.getPath(args);

    // whenever we access data, make sure, the path is registered
    this._registerPathListener(path);

    return this._dataSource.getData(path, args);
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

  _registerPathListener(path) {
    this._dataSource.registerListener(path, this);
  }

  /**
   * Internally used method when the component owning this data accessor is unmounted.
   */
  unmount() {
    this._dataSource.unregisterListener(this);
  }
}







import FirebaseDataProvider, { 
  FirebaseAuthProvider 
} from 'dbdi/firebase/FirebaseDataProvider';

const dataProviders = {
  firebase: new FirebaseDataProvider(),
  firebaseAuth: new FirebaseAuthProvider()
  //temp: new ...(),
  //webCache: ...
};

const dataSourceCfg = {
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
//    "uid" -> "thisProjectIndices" -> "thisProjects" -> "thisProject" -> "projectStages" -> "stakeHolders" + "stakeHolderStatus"
const pathDescriptorTransformations = {
  projectsOfUser({ uid }, { }, { projectIdsOfUser, project }) {
    return map(projectIdsOfUser({ uid }) || EmptyObject, projectId => project({ projectId }));
  },

  usersOfProject({ projectId }, { }, { uidsOfProject, user }) {
    return map(uidsOfProject({ projectId }) || EmptyObject, uid => user({ uid }));
  },

  stageContributions({ projectId, stageId }, { }, { projectStage }) {
    const stage = projectStage({ projectId, stageId });
    return stage && stage.contributions;
  },

  stageContributors(
    { projectId, stageId }, { }, { projectStage, stageContributorUserList }
  ) {
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

  stageContributorUserList(
    { projectId, groupName },
    { },
    { usersOfProject, projectReviewer, users: { gms } }
  ) {
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


const LoadedProjectControlView = dataBind()(
  ({ }, { }) => {
    console.log('ProjectControlView.render');
    return (<div>
      <ProjectStagesView stageNode={ProjectStageTree.root} />
    </div>);
  }
);

// TODO: inject our DataSource first!!!

const ProjectControlView = dataBind()(
  ({ projectId }, { project, projectStages }) => {
    const thisProject = project(projectId);
    const thisProjectStages = projectStages(projectId);
    const newContext = {
      thisProjectId: projectId,
      thisProject,
      thisProjectStages
    };
    return thisProject &&
      (<LoadedProjectControlView context={newContext} />) ||
      (<LoadIndicator />);
  }
);

const dataSourceProps = {
  dataProviders,
  dataSourceProps
};
export default () => (
  <DataSourceProvider {...dataSourceProps}>
    <ProjectControlView />
  </DataSourceProvider>
);
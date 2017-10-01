import Roles from 'src/core/users/Roles';

import {
  ProjectStageTree,
  StageStatus
} from 'src/core/projects/ProjectDef';

import autoBind from 'src/util/auto-bind';
import { EmptyObject, EmptyArray } from 'src/util';

import map from 'lodash/map';
import mapValues from 'lodash/mapValues';
import forEach from 'lodash/forEach';

import React, { Component, Children } from 'react';
import PropTypes from 'prop-types';
import { Flex, Item } from 'react-flex';

import {
  Panel, Button, Alert, Well
} from 'react-bootstrap';

import dataBind from 'src/dbdi/react/dataBind';
import DataSourceProvider from 'src/dbdi/react/DataSourceProvider';

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






import FirebaseDataProvider, {
  FirebaseAuthProvider
} from 'src/dbdi/firebase/FirebaseDataProvider';

const dataProviders = {
  firebase: new FirebaseDataProvider(),
  firebaseAuth: new FirebaseAuthProvider()
  //temp: new ...(),
  //webCache: ...
};

const allStagesStatus = {
  path: 'status',
  children: {
    projectStageStatus: {
      path: '$(stageId)',
      children: {
        num: 'num',
        status: 'status',
        startTime: 'startTime',
        finishTime: 'finishTime'
      }
    }
  }
};

const projectStageContributions = {
  pathTemplate: 'contributions',
  children: {
    contribution: {
      pathTemplate: '$(uid)',
      children: {
        contributorStatus: 'status',
        contributorData: 'data'
      }
    }
  }
};

const allProjectStageData = {
  path: 'data',
  children: {
    projectStageData: {
      path: '$(stageId)',
      children: {
        projectStageContributions
      }
    }
  }
};

const dataSourceConfig = {
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
      allProjectData: {
        path: '/projects',
        readers: {
          projectsOfUser({ uid }, { }, { projectIdsOfUser, project }) {
            return mapValues(projectIdsOfUser({ uid }) || EmptyObject, projectId => project({ projectId }));
          },

          usersOfProject({ projectId }, { }, { uidsOfProject, user }) {
            return mapValues(uidsOfProject({ projectId }) || EmptyObject, uid => user({ uid }));
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
        },
        children: {
          projects: {
            path: 'list',
            children: {
              project: {
                path: '$(projectId)',
                children: {
                  
                }
              }
            }
          },
          allProjectStages: {
            path: 'stages',
            children: {
              projectStages: {
                path: '$(projectId)',
                children: {
                  allStagesStatus,
                  allProjectStageData
                }
              }
            }
          },
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


const LoadedProjectControlView = dataBind()(
  ({ }, { }) => {
    console.log('ProjectControlView.render');
    return (<div>
      <ProjectStagesView stageNode={ProjectStageTree.root} />
    </div>);
  }
);



const ProjectControlView = dataBind()(
  ({ projectId }, { project, projectStageStatus }) => {
    const thisProject = projectId && project({projectId});
    const thisProjectStageStatus = projectId && projectStageStatus({projectId});
    const newContext = {
      thisProjectId: projectId,
      thisProject,
      thisProjectStageStatus
    };
    return thisProject &&
      (<LoadedProjectControlView context={newContext} />) ||
      (<LoadIndicator />);
  }
);

const ProjectControlList = dataBind()(
  ({ currentUid }, { projectsOfUser }) => {
    if (!projectsOfUser.isDataLoaded({currentUid})) {
      return <LoadIndicator block />;
    }
    
    const currentProjects = projectsOfUser({currentUid});
    if (!currentProjects) {
      return (<Alert bsStyle="warning">
        你目前沒有在進行專案。推薦選擇任務並且找守門人註冊新的～
      </Alert>);
    }
  }
);


const dataSourceProps = {
  dataProviders,
  dataSourceConfig
};

const WrappedView = ({ }) => (
  <DataSourceProvider {...dataSourceProps}>
    <ProjectControlList />
  </DataSourceProvider>
);

export default WrappedView;
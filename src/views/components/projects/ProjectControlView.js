import Roles from 'src/core/users/Roles';

import {
  ProjectStageTree,
  StageStatus,
  ContributorGroupNames
} from 'src/core/projects/ProjectDef';

import autoBind from 'src/util/auto-bind';
import { EmptyObject, EmptyArray } from 'src/util';

import map from 'lodash/map';
import mapValues from 'lodash/mapValues';
import forEach from 'lodash/forEach';
import isEmpty from 'lodash/isEmpty';
import sortBy from 'lodash/sortBy';

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
    name: 'question'
  },
  [StageStatus.NotStarted]: {
    name: 'question'
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


function StageStatusIcon({ status, ...props }) {
  const iconCfg = statusIcons[status];
  const style = statusStyles[status];
  return (<FAIcon {...iconCfg} style={style} {...props} />);
}
StageStatusIcon.propTypes = {
  status: PropTypes.number.isRequired
};

          
// TODO: mixing together data from very different sources can quickly cause trouble!

const StageContributorIcon = dataBind()(
  ({ uid, groupName, user, status }, {}) => {
    status = status || 0;

    const classes = 'project-contributor project-contributor-' + groupName;
    return <span>{JSON.stringify(user)}</span>;
    // return (
    //   <div className={classes} style={{ backgroundImage: 'url(' + user.photoURL + ')' }}>
    //     {status &&
    //       <StageStatusIcon status={status}
    //         className=".project-contributor-status-icon" />
    //     }
    //   </div>
    // );
  }
);



// Render icon + status of all responsible contributors for given stage


const StageStatusBar = dataBind()(
  ({ thisProjectId, stageNode }, 
    { stageContributors, stageContributorStatus }) => {
    const projectId = thisProjectId;
    const { stageId } = stageNode;
    let contributors = projectId && stageContributors({ projectId, stageId: stageNode.stageId });

    // render all groups of contributors
    return (<div>
      {map(contributors, (contributorSet, iSet) => {
        const {
          groupName,
          signOffCount,
          userList
        } = contributorSet;

        if (signOffCount > 0 && signOffCount < userList.length) {
          // render "unknown user" icons
          // TODO
        }
        else {
          // render icons of the actual users in group
          return (<div key={iSet}>
            {map(userList, 
              (user, uid) => (<StageContributorIcon
                key={uid}
                uid={uid}
                user={user}
                groupName={groupName}
                status={stageContributorStatus({projectId, stageId, uid}) || 0}
              />)
            )}
          </div>);
        }
      })}
    </div>);
  }
);
StageStatusBar.propTypes = {
  stageNode: PropTypes.object.isRequired
};



// ####################################################
// Project tree + stage logic
// ####################################################

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
  ({ stageNode }, { }) => {
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
  path: 'sprintStatus',
  children: {
    sprintStageStatus: {
      path: '$(sprintStageId)',
      children: {
        stageName: 'name',
        stageStatus: 'status',
        stageStartTime: 'startTime',
        stageFinishTime: 'finishTime'
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
        stageContributorStatus: 'status',
        stageContributorData: 'data'
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
          gms: { 
            path: {
              queryParams: [['orderByChild', 'role'], ['startAt', Roles.GM]]
            }
          },
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
            return mapValues(
              projectIdsOfUser({ uid }) || EmptyObject, 
              projectId => project({ projectId })
            );
          },

          usersOfProject({ projectId }, { }, { uidsOfProject, user }) {
            return mapValues(
              uidsOfProject({ projectId }) || EmptyObject,
              uid => user({ uid })
            );
          },

          projectReviewers({ projectId }, {}, { project, user }) {
            // single reviewer as "list" or "object" of reviewers
            const proj = project({projectId});
            const uid = proj && proj.guardianUid;
            const reviewer = uid && user({ uid });
            return reviewer && { [uid]: reviewer } || null;
          },

          stageContributions({ projectId, stageId }, { }, { projectStage }) {
            const stage = projectStage({ projectId, stageId });
            return stage && stage.contributions;
          },

          stageContributors({ projectId, stageId }, { }, { stageContributorUserList }) {
            const node = stageId && ProjectStageTree.getNode(stageId);

            if (node && node.stageDef.contributors) {
              // get userList for each contributor group
              const contributorDefinitions = map(node.stageDef.contributors, contributorSet => {
                const { groupName } = contributorSet;
                const userList = stageContributorUserList({ projectId, groupName });
                return Object.assign({}, contributorSet, { userList });
              });

              // sort
              return sortBy(contributorDefinitions, ['groupName']);
            }
            return null;
          },

          stageContributorUserList(
            { projectId, groupName },
            { },
            { usersOfProject, projectReviewers, gms }
          ) {
            switch (groupName) {
              case 'gm':
                return gms();
              case 'party':
                return usersOfProject({ projectId });
              case 'reviewer':
                return projectReviewers({ projectId });
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
    return (<div>
      <ProjectStagesView stageNode={ProjectStageTree.root} />
    </div>);
  }
);



const ProjectControlView = dataBind()(
  ({ projectId }, { project }) => {
    const thisProject = projectId && project({projectId});
    const newContext = {
      thisProjectId: projectId,
      thisProject
    };
    
    return thisProject &&
      (<LoadedProjectControlView setContext={newContext} />) ||
      (<LoadIndicator block />);
  }
);

const ProjectControlList = dataBind()(
  ({ currentUid }, { projectIdsOfUser }) => {
    if (!currentUid || !projectIdsOfUser.isLoaded({uid: currentUid})) {
      return (<LoadIndicator block size={1.5} />);
    }
    
    const currentProjectIds = projectIdsOfUser({uid: currentUid});
    if (isEmpty(currentProjectIds)) {
      return (<Alert bsStyle="warning">
        你目前沒有在進行專案。推薦選擇任務並且找守門人註冊新的～
      </Alert>);
    }
    else {
      return (<div>{
        map(currentProjectIds, (_, projectId) =>
          (<ProjectControlView key={projectId} projectId={projectId} />)
        )
      }</div>);
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
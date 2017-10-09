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
import size from 'lodash/size';
import times from 'lodash/times';
import pickBy from 'lodash/pickBy';

import React, { Component, Children } from 'react';
import PropTypes from 'prop-types';
import { Flex, Item } from 'react-flex';

import {
  Panel, Button, Alert, Well
} from 'react-bootstrap';

import Form from 'react-jsonschema-form';

import dataBind from 'src/dbdi/react/dataBind';
import DataSourceProvider from 'src/dbdi/react/DataSourceProvider';

import FAIcon from 'src/views/components/util/FAIcon';
import LoadIndicator from 'src/views/components/util/loading';

import UserIcon from 'src/views/components/users/UserIcon';



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
    color: 'gray'
  },
  [StageStatus.NotStarted]: {
    color: 'gray'
  },
  [StageStatus.Started]: {
    color: 'blue'
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

const StageContributorIcon = dataBind()(
  ({ projectId, stageId, groupName, uid }, { userPublic, stageContributorStatus }) => {

    const isStatusLoaded = stageContributorStatus.isLoaded({projectId, stageId, uid});
    const isUserLoaded = !uid || userPublic.isLoaded({projectId, stageId, uid});
    const status = stageContributorStatus({projectId, stageId, uid}) || 0;
    const user = isUserLoaded && uid && userPublic({uid});

    const statusIconEl = (
      !isStatusLoaded ? 
        <LoadIndicator /> :
        <StageStatusIcon status={status} className="project-contributor-status-icon" />
    );

    const classes = 'project-contributor project-contributor-' + groupName;
    if (!uid) {
      // unknown user
      return (
        <FAIcon className={classes} name="user-secret" >
          {statusIconEl}
        </FAIcon>
      );
    }
    else {
      // user icon
      return (
        !isUserLoaded ? 
          <LoadIndicator /> :
          <div className={classes}>
            <UserIcon user={user} />
            {statusIconEl}
          </div>
      );
    }
  }
);



// Render icon + status of all responsible contributors for given stage


const StageStatusBar = dataBind()(
  ({ thisProjectId, stageNode }, { stageContributors }) => {
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

        // first: all already known users
        const userEls = map(userList, 
          (user, uid) => (<Item key={uid} flex="none">{
            (<StageContributorIcon
              projectId={projectId}
              stageId={stageId}
              uid={uid}
              groupName={groupName}
            />)}
          </Item>)
        );

        // then: all missing users
        let unknownEls;
        if (signOffCount > 0 && signOffCount > userEls.length) {
          unknownEls = times(signOffCount - userEls.length, () =>
            (<StageContributorIcon
              projectId={projectId}
              stageId={stageId}
              uid={null}
              groupName={groupName}
            />)
          );
        }

        // render icons of the actual users in group
        return (<Flex row key={iSet} justifyContent="flex-end" alignItems="center">
          { userEls }
          { unknownEls }
        </Flex>);
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




// TODO: [ProjectStageTree]
// TODO: data tree + format tree have the same shape
// TODO: in case of repeatable nodes, data tree holds array instead of single object
// TODO: contributor data is still by UID
// TODO: in case more people than signOffCount from groupName give feedback, just show them all?
// TODO: write operations
// TODO: forms


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
          userPublic: {
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
              (_, projectId) => project({ projectId })
            );
          },

          usersOfProject({ projectId }, { }, { uidsOfProject, userPublic }) {
            return mapValues(
              uidsOfProject({ projectId }) || EmptyObject,
              (_, uid) => userPublic({ uid })
            );
          },

          projectReviewers({ projectId }, {}, { project, userPublic }) {
            // single reviewer as "list" or "object" of reviewers
            const proj = project({projectId});
            const uid = proj && proj.guardianUid;
            const reviewer = uid && userPublic({ uid });
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
            // TODO: mix this with stage contribution data!
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
  ({ }, { projectIdsOfUser, currentUid }) => {
    const uid = currentUid();
    if (!uid || !projectIdsOfUser.isLoaded({uid})) {
      return (<LoadIndicator block size={1.5} />);
    }
    
    const currentProjectIds = projectIdsOfUser({uid});
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
  dataSourceConfig: {
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
        projectIdsOfUser: '/_index/projectUsers/user/$(uid)',
        allTests: {
          path: '/test',
          children: {
            test: {
              path: '$(testId)',
              children: {
              }
            }
          }
        }
      }
    }
  }
};


const TestFormSchema = {
  'title': '',
  'description': '',
  'type': 'object',
  'required': [
    'lastName'
  ],
  'properties': {
    'title': {
      'type': 'string',
      'title': 'Title'
    },
    'lastName': {
      'type': 'string',
      'title': 'Last name'
    },
    'other': {
      'type': 'string',
      'title': 'Other'
    }
  }
};


const TestFormUISchema = {
  'firstName': {
    'ui:autofocus': true,
    'ui:label': false,
    'ui:readonly': true
  }
};

const testLog = (type) => console.log.bind(console, type);

const FormTest = dataBind()(
  () => (<div>
    <h2>Add new data</h2>
    <TestEditor testId={null} data={null} setContext={{world: 'world'}} />

    <h2>All existing data</h2>
    <AllTests />
  </div>)
);
const TestEditor = dataBind(({ testId }, { set_test, push_allTests, delete_test }) => ({
  onSubmit({formData}) {
    formData = pickBy(formData, val => val !== undefined);
    if (!testId) {
      // new test data
      push_allTests(formData);
    }
    else {
      // existing test data
      set_test({ testId }, formData);
    }
  },

  doDelete(evt) {
    evt.preventDefault();
    return delete_test({testId});
  }
}))(
  ({ testId }, { onSubmit, doDelete, test }) => {
    const data = testId && test({testId}) || EmptyObject;
    return (<div>
      <h2>{data.title}</h2>
      <Form schema={TestFormSchema}
        liveValidate={true}
        uiSchema={TestFormUISchema}
        formData={data}
        onChange={testLog('changed')}
        onError={testLog('errors')}
        onSubmit={onSubmit} >
        <p>
          <button type="submit" className="btn btn-info">
            {testId ? 'Update' : 'Add'}
          </button>
          { testId &&
            <button className="btn btn-warning" onClick={doDelete}>
              Delete!
            </button>
          }
        </p>
      </Form>
    </div>);
  }
);
const AllTests = dataBind()(
  ({ }, { allTests }) => {
    const tests = allTests();
    return (<div>
      <h3>{size(tests)}</h3>
      { map(tests, (test, testId) => (<div key={testId}>
        <hr />
        <TestEditor testId={testId} />
      </div>)) }
      <hr />
      <pre>{JSON.stringify(tests, null, 2)}</pre>
    </div>);
  }
);

const WrappedView = ({ }) => (
  <DataSourceProvider {...dataSourceProps}>
    <FormTest />
  </DataSourceProvider>
);

export default WrappedView;
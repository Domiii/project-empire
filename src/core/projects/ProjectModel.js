import {
  ProjectStageTree,
  StageStatus,
  ContributorGroupNames
} from 'src/core/projects/ProjectDef';


import { EmptyObject, EmptyArray } from 'src/util';

import map from 'lodash/map';
import mapValues from 'lodash/mapValues';
import forEach from 'lodash/forEach';
import isEmpty from 'lodash/isEmpty';
import sortBy from 'lodash/sortBy';
import size from 'lodash/size';
import times from 'lodash/times';
import pickBy from 'lodash/pickBy';


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
    projectStageRecord: {
      path: '$(stageId)',
      children: {
        projectStageContributions
      }
    }
  }
};

const readers = {
  projectsOfUser({ uid }, { projectIdsOfUser, project }, { }) {
    return mapValues(
      projectIdsOfUser(
        { uid }) || EmptyObject,
      (_, projectId) => project({ projectId }
      )
    );
  },

  usersOfProject({ projectId }, { uidsOfProject, userPublic }, { }) {
    return mapValues(
      uidsOfProject(
        { projectId }) || EmptyObject,
      (_, uid) => userPublic({ uid }
      )
    );
  },

  projectReviewers({ projectId }, { project, userPublic }, { }) {
    const proj = project({ projectId });
    const uid = proj && proj.guardianUid;
    const reviewer = uid && userPublic({ uid });
    
    // single reviewer as "list" or "object" of reviewers
    return reviewer && { [uid]: reviewer } || EmptyObject;
  },


  // #########################################################################
  // Stages
  // #########################################################################

  getStageStatus({ projectId, stageId }, { projectStageRecord }, { }) {
    // TODO
    
    const node = ProjectStageTree.getNode(stageId);
    const stageRecord = projectStageRecord({ projectId, stageId });

    if (node.noStatus) {
      return StageStatus.None;
    }
    if (node.stageDef.id === 'prepare') {
      return StageStatus.Finished;
    }
    return StageStatus.None;
  },
  

  stageContributions({ projectId, stageId }, { projectStageRecord }, { }) {
    const stage = projectStageRecord({ projectId, stageId });
    return stage && stage.contributions;
  },

  stageContributors({ projectId, stageId }, { stageContributorUserList }, { }) {
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
    { usersOfProject, projectReviewers, gms },
    { }
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
};

export default {
  uidsOfProject: '/_index/projectUsers/project/$(projectId)',
  projectIdsOfUser: '/_index/projectUsers/user/$(uid)',
  allProjectData: {
    path: '/projects',
    readers,
    children: {
      projects: {
        path: 'list',
        children: {
          project: {
            path: '$(projectId)',
            onWrite: [
              'updatedAt',
              'createdAt'
            ],
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
  }
};
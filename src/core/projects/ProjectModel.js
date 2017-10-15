import {
  ProjectStageTree,
  StageStatus,
  ContributorGroupNames
} from 'src/core/projects/ProjectDef';


import { EmptyObject, EmptyArray } from 'src/util';
import { getOptionalArguments } from 'src/dbdi/dataAccessUtil';

import map from 'lodash/map';
import mapValues from 'lodash/mapValues';
import filter from 'lodash/filter';
import forEach from 'lodash/forEach';
import isEmpty from 'lodash/isEmpty';
import sortBy from 'lodash/sortBy';
import size from 'lodash/size';
import some from 'lodash/some';
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
  activeProjectsOfUser({ uid }, { activeProjectIdsOfUser, projectById }, { }) {
    return mapValues(
      activeProjectIdsOfUser(
        { uid }) || EmptyObject,
      (_, projectId) => projectById({ projectId }
      )
    );
  },

  archivedProjectsOfUser({ uid }, { archivedProjectIdsOfUser, projectById }, { }) {
    return mapValues(
      archivedProjectIdsOfUser(
        { uid }) || EmptyObject,
      (_, projectId) => projectById({ projectId }
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

  uidsWithoutProject({ }, { activeProjectIdsOfUser }, { usersPublic }) {
    // TODO: make this more efficient (achieve O(k), where k = users without project)
    if (!usersPublic.isLoaded()) {
      return undefined;
    }

    if (!usersPublic) {
      return null;
    }

    const uids = Object.keys(usersPublic);
    if (some(uids, uid => !activeProjectIdsOfUser.isLoaded({uid}))) {
      // not everything has loaded yet
      return undefined;
    }

    return filter(uids, uid => size(activeProjectIdsOfUser({uid})) > 0);
  },

  projectReviewers({ projectId }, { projectById, userPublic }, { }) {
    const proj = projectById({ projectId });
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

import zipObject from 'lodash/zipObject';
//import times from 'lodash/times';

const writers = {
  updateAll({ pathArgs, readers, val }, {}, {}, { update_db }) {
    const updateObj = zipObject(
      map(readers, reader => reader.getPath(pathArgs)),
      times(readers.length, val)
    );
    return update_db(updateObj);
  },

  addUserToProject(
    { uid, projectId },
    { uidOfProject, projectIdOfUser }, 
    {}, 
    { updateAll }) {
    return updateAll({
      pathArgs: { uid, projectId },
      readers: [uidOfProject, projectIdOfUser],
      val: 1
    });
  },

  deleteUserFromProject(
    { uid, projectId },
    { uidOfProject, projectIdOfUser }, 
    {}, 
    { updateAll }) {
    return updateAll({
      pathArgs: { uid, projectId },
      readers: [uidOfProject, projectIdOfUser],
      val: null
    });
  }
};

const projectsPageCfg = {

};

export default {
  projectUidIndex: {
    path: '/_index/projectUsers/project',
    children: {
      uidsOfProject: {
        path: '$(projectId)',
        children: {
          uidOfProject: '$(uid)'
        }
      }
    }
  },
  activeProjectIdsOfUser: {
    path: '/_index/projectUsers/user/$(uid)',
    children: {
      activeProjectIdOfUser: '$(projectId)'
    }
  },
  allProjectData: {
    path: '/projects',
    readers,
    writers,
    children: {
      projectList: {
        path: 'list',
        readers: {
          sortedProjectIdsOfPage(args, { projectsOfPage }, { }) {
            if (!projectsOfPage.isLoaded(args)) {
              return EmptyArray;
            }

            const projects = projectsOfPage(args);

            const {
              orderBy,
              ascending
            } = getOptionalArguments(args, {
                orderBy: 'updatedAt',
                ascending: false
              });

            return sortBy(Object.keys(projects || EmptyObject),
              id => ascending ?
                projects[id][orderBy] :
                -projects[id][orderBy]
            );
          }
        },
        children: {
          projectsOfPage: {
            path: {
              queryParams(args) {
                const {
                  page
                } = args;

                const {
                  orderBy,
                  itemsPerPage,
                  ascending
                } = getOptionalArguments(args, {
                    orderBy: 'updatedAt',
                    itemsPerPage: 20,
                    ascending: false
                  });

                return [
                  ['orderByChild', orderBy],
                  [ascending ? 'limitToFirst' : 'limitToLast', page * itemsPerPage]
                ];
              }
            }
          },
          projectById: {
            path: '$(projectId)',
            onWrite: [
              'updatedAt',
              'createdAt'
            ],
            children: {
              projectMissionId: 'missionId',

              // only one reviewer (GM) for now
              projectReviewerId: 'reviewerId',

              projectGuardianId: 'guardianId'
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
import {
  ProjectStageTree,
  ProjectStatus,
  StageStatus,
  StageContributorStatus,

  isProjectStatusOver,
  isStageStatusOver,
  isStageContributorStatusOver
} from 'src/core/projects/ProjectDef';


/**
 * TODO:
 *  implement StagePath (encoding + decoding)
 *  Store new stageEntry (set status + num) on Reviewer button click
 *  Fix `stageContributors` (cross-reference against `stageContributions`)
 *  per-contributor forms CRUD + UI
 *  Form table overview
 */

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

/**
 * Project main data
 */
const projectById = {
  path: '$(projectId)',
  onWrite: [
    'updatedAt',
    'createdAt'
  ],
  children: {
    projectMissionId: 'missionId',

    // only one reviewer (GM) for now
    projectReviewerUid: 'reviewerUid',

    projectGuardianUid: 'guardianUid',

    projectStatus: 'status'
  }
};

const stageEntries = {
  path: 'stageEntries',
  children: {
    stageEntry: {
      path: '$(stagePath)',
      children: {
        stageStatusRaw: 'status',
        stageStartTime: 'startTime',
        stageFinishTime: 'finishTime'
      }
    }
  }
};

const stageContributions = {
  pathTemplate: 'contributions',
  children: {
    stageContributions: {
      readers: {
        /**
         * Final (interpolated) contributor status,
         * considering all contributing factors
         */
        stageContributorStatus(
          { projectId, stagePath, uid },
          { stageContributorStatusRaw, get_stageStatus }, { }
        ) {
          const userStatus = stageContributorStatusRaw({ projectId, stagePath, uid });
          const stageStatus = get_stageStatus({ projectId, stagePath });

          if (isStageContributorStatusOver(userStatus)) {
            return userStatus;
          }

          if (isStageStatusOver(stageStatus)) {
            return StageContributorStatus.Failed;
          }

          return userStatus || StageContributorStatus.None;
        }
      },
      path: '$(stagePath)',
      children: {
        stageContribution: {
          path: '$(uid)',
          children: {
            /**
             * The contributor status as stored in DB
             */
            stageContributorStatusRaw: 'status',
            stageContributorData: 'data'
          }
        }
      }
    }
  }
};

const readers = {
  // #########################################################################
  // Project basics
  // #########################################################################

  sortedProjectIdsOfPage(args, { projectsOfPage }, { }) {
    if (!projectsOfPage.isLoaded(args)) {
      return undefined;
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
  },

  // #########################################################################
  // Project teams
  // #########################################################################

  allUidsNotInProject() {

  },

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

  uidsWithoutProject({ }, { },
    { userProjectIdIndex, userProjectIdIndex_isLoaded, usersPublic, usersPublic_isLoaded }) {
    // TODO: make this more efficient (achieve O(k), where k = users without project)
    if (!usersPublic_isLoaded || !userProjectIdIndex_isLoaded) {
      return undefined;
    }

    if (!usersPublic) {
      return null;
    }

    const uids = Object.keys(usersPublic);
    if (!userProjectIdIndex) {
      // not a single user is assigned yet
      return uids;
    }

    // get all uids of users who have no project yet
    return filter(uids, uid => !size(userProjectIdIndex[uid]));
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

  stageStatus(
    { projectId, stagePath },
    { stageStatusRaw, get_projectStatus }, { }
  ) {
    const stageStatus = stageStatusRaw({ projectId, stagePath });
    const projectStatus = get_projectStatus({ projectId, stagePath });

    if (isStageStatusOver(stageStatus)) {
      return stageStatus;
    }

    if (isProjectStatusOver(projectStatus)) {
      // stage is already done, but contributor did not finish their contribution
      return StageContributorStatus.Failed;
    }
    return stageStatus || StageContributorStatus.None;
  },

  stageContributions({ projectId, stagePath }, { projectStageRecord }, { }) {
    const stage = projectStageRecord({ projectId, stagePath });
    return stage && stage.contributions;
  },

  stageContributors({ projectId, stagePath }, { stageContributorUserList }, { }) {
    const node = stagePath && ProjectStageTree.getNode(stagePath);

    if (node && node.stageDef.contributors) {
      // get userList for each contributor group
      const contributorDefinitions = map(node.stageDef.contributors, contributorSet => {
        const { groupName } = contributorSet;
        
    // TODO: make use of stage contribution data here!

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
  updateAll({ pathArgs, readers, val }, { }, { }, { update_db }) {
    console.log(readers.length, times(readers.length, val));
    const updateObj = zipObject(
      map(readers, reader => reader.getPath(pathArgs)),
      times(readers.length, () => val)
    );
    return update_db(updateObj);
  },

  addUserToProject(
    { uid, projectId },
    { uidOfProject, activeProjectIdOfUser },
    { },
    { updateAll }) {
    return updateAll({
      pathArgs: { uid, projectId },
      readers: [uidOfProject, activeProjectIdOfUser],
      val: 1
    });
  },

  deleteUserFromProject(
    { uid, projectId },
    { uidOfProject, activeProjectIdOfUser },
    { },
    { updateAll }) {
    return updateAll({
      pathArgs: { uid, projectId },
      readers: [uidOfProject, activeProjectIdOfUser],
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
        reader(res) {
          return res === null ? EmptyObject : res;
        },
        children: {
          uidOfProject: '$(uid)'
        }
      }
    }
  },
  userProjectIdIndex: {
    path: '/_index/projectUsers/user',
    children: {
      activeProjectIdsOfUser: {
        path: '$(uid)',
        reader(res) {
          return res === null ? EmptyObject : res;
        },
        children: {
          activeProjectIdOfUser: '$(projectId)'
        }
      }
    }
  },
  allProjectData: {
    path: '/projects',
    readers,
    writers,
    children: {
      projectList: {
        path: 'list',
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
          projectById
        }
      },
      allProjectStages: {
        path: 'stages',
        children: {
          projectStages: {
            path: '$(projectId)',
            children: {
              stageEntries,
              stageContributions
            }
          }
        }
      },
    }
  }
};
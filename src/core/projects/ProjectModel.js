import firebase from 'firebase';

import Roles, {
} from 'src/core/users/Roles';

import {
  projectStageTree,
  ProjectStatus,
  StageStatus,
  StageContributorStatus,

  isProjectStatusOver,
  isStageStatusOver,
  isStageContributorStatusOver
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
import intersection from 'lodash/intersection';
import sumBy from 'lodash/sumBy';

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

    projectStatus: 'status',
    projectFinishTime: 'finishTime'
  }
};

const stageEntries = {
  path: 'stageEntries',
  children: {
    stageEntry: {
      path: '$(stagePath)',
      children: {
        stageStatusRaw: {
          path: 'status'
        },
        stageStartTime: 'startTime',
        stageFinishTime: 'finishTime'
      }
    }
  }
};

const allStageContributions = {
  path: 'contributions',
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
    const projectStatus = get_projectStatus({ projectId });

    if (isStageStatusOver(stageStatus)) {
      return stageStatus;
    }

    if (isProjectStatusOver(projectStatus)) {
      // project is already done, but stage has not been finished by team
      return StageContributorStatus.Failed;
    }
    return stageStatus || StageContributorStatus.None;
  },

  stageContributors({ projectId, stagePath }, { stageContributorUids }, { }) {
    const node = projectStageTree.getNodeByPath(stagePath);

    if (node.stageDef.contributors) {
      // get userList for each contributor group
      const contributorDefinitions = map(node.stageDef.contributors, contributorSet => {
        const { groupName, signOffCount } = contributorSet;

        const uids = stageContributorUids({ projectId, stagePath, groupName, signOffCount });
        return Object.assign({}, contributorSet, { uids });
      });

      // sort
      return sortBy(contributorDefinitions, ['groupName']);
    }
    return null;
  },

  isStageContributor({ uid, projectId, stagePath }, { isInContributorGroup }) {
    const node = projectStageTree.getNodeByPath(stagePath);

    if (node && node.stageDef.contributors) {
      // get userList for each contributor group
      let res = some(node.stageDef.contributors, contributorSet => {
        const { groupName } = contributorSet;
        return isInContributorGroup({ uid, projectId, groupName });
      });
      if (!res) {
        // might not have finished loading yet
        if (some(node.stageDef.contributors, contributorSet => {
          const { groupName } = contributorSet;
          return !isInContributorGroup.isLoaded({ uid, projectId, groupName });
        })) {
          return undefined;
        }
      }
      return res;
    }
    return false;
  },

  contributorGroupName({ uid, projectId },
    { usersOfProject, userHasRole, projectReviewers }) {
    
    let users;
    users = usersOfProject({ projectId });
    if (users && users[uid]) {
      return 'party';
    }

    users = projectReviewers({ projectId });
    if (users && !!users[uid]) {
      return 'reviewer';
    }

    if (userHasRole({ uid, role: Roles.GM })) {
      return 'gm';
    }

    return null;
  },

  isInContributorGroup({ uid, projectId, groupName },
    { userHasRole, usersOfProject, projectReviewers }) {
    switch (groupName) {
      case 'gm':
        return userHasRole({ uid, role: Roles.GM });
      case 'party': {
        const users = usersOfProject({ projectId });
        if (!users) {
          return users;
        }
        return !!users[uid];
      }
      case 'reviewer': {
        const users = projectReviewers({ projectId });
        if (!users) {
          return users;
        }
        return !!users[uid];
      }
      default:
        console.error('invalid groupName in stage definition: ' + groupName);
        return false;
    }
  },

  stageContributorGroupUsers({ projectId, groupName },
    { usersOfProject, projectReviewers, gms }) {
    let allUsers;
    switch (groupName) {
      case 'gm':
        allUsers = gms();
        break;
      case 'party':
        allUsers = usersOfProject({ projectId });
        break;
      case 'reviewer':
        allUsers = projectReviewers({ projectId });
        break;
      default:
        console.error('invalid groupName in stage definition: ' + groupName);
        allUsers = EmptyObject;
        break;
    }
    return allUsers;
  },

  stageContributorUids(
    { signOffCount, projectId, stagePath, groupName },
    { get_stageContributions, stageContributorGroupUsers },
    { }
  ) {
    //const node = projectStageTree.getNodeByPath(stagePath);
    if (signOffCount && !get_stageContributions.isLoaded({ projectId, stagePath })) {
      return undefined;
    }

    // TODO: optimize if signOffCount significantly smaller than set of potential contributors

    const allPotentialUsers = stageContributorGroupUsers({ projectId, groupName });
    if (!allPotentialUsers) {
      return allPotentialUsers;
    }

    const potentialContributorUids = Object.keys(allPotentialUsers);
    if (!signOffCount) {
      // all potential users must contribute
      return potentialContributorUids;
    }

    if (signOffCount >= potentialContributorUids.length) {
      // all potential users must contribute
      return potentialContributorUids;
    }

    // we only know of the contributors who already contributed
    const stageContributions = get_stageContributions({ projectId, stagePath });
    //console.error(signOffCount, size(stageContributions), stageContributions);

    if (stageContributions) {
      const contributedUids = Object.keys(stageContributions);
      return intersection(contributedUids, potentialContributorUids);
    }
    return null;
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
  },

  updateProjectStatus(
    { uid, projectId, status },
    { projectStatus, projectFinishTime },
    { },
    { update_db }
  ) {
    // TODO: handle archiving properly
    const updates = {
      [projectStatus.getPath({ projectId })]: status,
      [projectFinishTime.getPath({ projectId })]: firebase.database.ServerValue.TIMESTAMP
    };

    return update_db(updates);
  },

  updateStageContributorStatus(
    { uid, projectId, stagePath, contributorStatus },
    { get_stageContributions, isInContributorGroup },
    { },
    { }
  ) {
    if (isStageContributorStatusOver(contributorStatus)) {
      // check if stageStatus has changed
      const node = projectStageTree.getNodeByPath(stagePath);
      const stageContributions = get_stageContributions({ projectId, stagePath });

      //sumBy(contributors, (contributorSet) => {
      if (node.stageDef.contributors) {
        sumBy(node.stageDef.contributors, (contributorSet) => {
          const {
            groupName,
            signOffCount
          } = contributorSet;

          isInContributorGroup({ uid, projectId, groupName });

          // check if signatures are sufficient
          if (signOffCount && signOffCount > uids.length) {
            hi
          }
        });
      }
    }
  },

  updateStageStatus(
    { uid, projectId, stagePath, status },
    { stageStatusRaw, stageFinishTime },
    { },
    { updateStageStatus, updateProjectStatus, update_db }) {
    const updates = {};

    // TODO: generate notification entry
    // TODO: generalize batch writing through updates

    // update this status
    updates[stageStatusRaw.getPath({ projectId, stagePath })] = status;
    updates[stageFinishTime.getPath({ projectId, stagePath })] = firebase.database.ServerValue.TIMESTAMP;

    const promises = [];

    //if (isStageStatusOver(status)) {
    const node = projectStageTree.getNodeByPath(stagePath);

    if (node.isRoot) {
      // last stage in project -> update project status
      promises.push(updateProjectStatus({ uid, projectId, status: status }));
    }
    else if (node.isLastInLine) {
      // last stage in line -> update parent stage status as well
      const parentPath = projectStageTree.getParentPathOfPath(stagePath);
      promises.push(updateStageStatus({ uid, projectId, stagePath: parentPath, status }));
    }

    //}
    return Promise.all([update_db(updates), ...promises]);
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
              allStageContributions
            }
          }
        }
      },
    }
  }
};
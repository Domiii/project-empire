import Roles, {
} from 'src/core/users/Roles';

import {
  projectStageTree,
  StageStatus,
  StageContributorStatus,

  isProjectStatusOver,
  isStageStatusOver,
  isStageContributorStatusOver
} from 'src/core/projects/ProjectDef';

import {
  isAscendantPath
} from 'src/core/projects/ProjectPath';

import { EmptyObject, EmptyArray } from 'src/util';
import { getOptionalArgument, getOptionalArguments } from 'dbdi/util';

import map from 'lodash/map';
import sortBy from 'lodash/sortBy';
import some from 'lodash/some';
import intersection from 'lodash/intersection';
import sumBy from 'lodash/sumBy';

export default {

  isAscendantOfActiveStage(
    { projectId, stagePath },
    { get_activeStagePath },
    { }
  ) {
    const activeStagePath = get_activeStagePath({ projectId }) || '';
    //console.log(`${activeStagePath}.startsWith(${stagePath})`);
    return isAscendantPath(stagePath, activeStagePath);
  },

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
        console.error('unknown groupName in stage definition: ' + groupName);
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
  },
  /**
   * Final (interpolated) contributor status,
   * considering all contributing factors
   */
  stageContributorStatus(
    { projectId, stagePath, uid },
    { stageContributorStatusRaw, get_stageStatus },
    { }
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
  },

  hasStageReviewerPrivilege(
    { uid, projectId, stagePath },
    { },
    { isCurrentUserGuardian }
  ) {
    // for now, only guardians and above are allowed to help review/moderate projects
    return isCurrentUserGuardian;
  },

  stageContributorFinishCount(
    args,
    { force_stageContributions, force_isInContributorGroup },
    { }
  ) {
    const { projectId, stagePath, groupName } = args;
    const ignoreUid = getOptionalArgument(args, 'ignoreUid');
    const stageContributions = force_stageContributions({ projectId, stagePath });

    return sumBy(stageContributions, ({ status }, contributorUid) => {
      if (ignoreUid !== contributorUid &&
        force_isInContributorGroup({ uid: contributorUid, projectId, groupName }) &&
        isStageContributorStatusOver(status)) {
        return 1;
      }
      return 0;
    });
  },

  /**
   * Get stagePath that follows given stagePath in our linearization schema
   */
  nextStagePath(
    { projectId, stagePath },
    { get_stageEntries },
    { }
  ) {
    const stageEntries = get_stageEntries({ projectId });
    if (stageEntries === undefined) {
      return undefined;
    }
    return projectStageTree.getNextPathByPath(stagePath, stageEntries);
  }
};
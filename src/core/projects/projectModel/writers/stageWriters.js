import firebase from 'firebase';

import {
  projectStageTree,
  StageStatus,

  isStageStatusOver,
  isStageContributorStatusOver
} from 'src/core/projects/ProjectDef';

import {
  pathToParent,
  pathToNextIteration
} from 'src/core/projects/ProjectPath';

import reduce from 'lodash/reduce';

export default {
  addStageIteration(
    { uid, projectId, stagePath },
    { },
    { },
    { updateStageStatus }
  ) {
    const newPath = pathToNextIteration(stagePath);
    const newStatus = StageStatus.None;
    return updateStageStatus({ uid, projectId, stagePath: newPath, status: newStatus });
  },

  /**
   * updateStageContributorStatus
   */
  updateStageContributorStatus(
    { uid, projectId, stagePath, newStatus },
    { get_stageContribution,
      force_isInContributorGroup,
      stageContributorFinishCount },
    { },
    { updateStageStatus, set_stageContribution }
  ) {
    const node = projectStageTree.getNodeByPath(stagePath);
    if (!node.stageDef.contributors) {
      throw new Error('tried to call updateStageContributorStatus on node without contributors: ' + stagePath);
    }

    const isContributorDone = isStageContributorStatusOver(newStatus);
    const contribution = get_stageContribution({ projectId, stagePath, uid }) || {};
    const oldStatus = contribution.status;
    const wasContributorDone = isStageContributorStatusOver(oldStatus);

    contribution.status = newStatus;
    const promises = [
      set_stageContribution({ projectId, stagePath, uid }, contribution)
    ];


    if (isContributorDone !== wasContributorDone) {
      // check if stageStatus has changed
      const isStageDone = reduce(node.stageDef.contributors, (isDone, contributorSet) => {
        const {
          groupName,
          signOffCount
        } = contributorSet;

        if (!isDone) { return false; }

        // sum up original count
        let currentCount = stageContributorFinishCount({ projectId, stagePath, groupName, ignoreUid: uid });

        // check if we add this contributor's status to count
        if (isContributorDone && force_isInContributorGroup({ uid, projectId, groupName })) {
          currentCount += 1;
        }

        // check if signatures are sufficient
        return currentCount >= signOffCount;
      }, true);

      const newStatus = isStageDone ? StageStatus.Finished : StageStatus.None;
      promises.push(updateStageStatus({ uid, projectId, stagePath, status: newStatus }));
    }

    return Promise.all(promises);
  },

  updateStageStatus(
    { uid, projectId, stagePath, status },
    { stageStatusRaw, stageFinishTime, force_activeStagePath, force_nextStagePath },
    { },
    { updateStageStatus, updateProjectStatus, update_db }) {
    const updates = {};

    // TODO: generate notification entry
    // TODO: generalize batch writing through updates

    // update this status
    updates[stageStatusRaw.getPath({ projectId, stagePath })] = status;
    updates[stageFinishTime.getPath({ projectId, stagePath })] = firebase.database.ServerValue.TIMESTAMP;

    const promises = [];

    const node = projectStageTree.getNodeByPath(stagePath);
    const activeStagePath = force_activeStagePath({ projectId });
    const needsPathUpdate = activeStagePath === stagePath || !activeStagePath;

    // update activeStagePath
    if (isStageStatusOver(status) && needsPathUpdate) {
      const nextStagePath = force_nextStagePath({ projectId, stagePath });
      updates[force_activeStagePath.getPath({ projectId })] = nextStagePath;
    }

    if (node.isRoot) {
      // last stage in project -> update project status
      promises.push(updateProjectStatus({ uid, projectId, status: status }));
    }
    else if (node.isLastInLine) {
      // last stage in line -> update parent stage status as well
      const parentPath = pathToParent(stagePath);
      promises.push(updateStageStatus({ uid, projectId, stagePath: parentPath, status }));
    }

    //}
    return Promise.all([update_db(updates), ...promises]);
  }
};
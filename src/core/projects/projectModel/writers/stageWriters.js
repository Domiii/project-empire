import firebase from 'firebase';

import {
  projectStageTree,
  StageStatus,
  
  isStageStatusOver,
  isStageContributorStatusOver
} from 'src/core/projects/ProjectDef';

import reduce from 'lodash/reduce';

export default {
  /**
   * updateStageContributorStatus
   */
  updateStageContributorStatus(
    { uid, projectId, stagePath, newStatus },
    { force_stageContribution,
      force_isInContributorGroup,
      stageContributorFinishCount },
    { },
    { updateStageStatus, set_stageContribution, set_activeStagePath }
  ) {
    const node = projectStageTree.getNodeByPath(stagePath);
    if (!node.stageDef.contributors) {
      throw new Error('tried to call updateStageContributorStatus on node without contributors: ' + stagePath);
    }

    const isContributorDone = isStageContributorStatusOver(newStatus);
    const contribution = force_stageContribution({ projectId, stagePath, uid });
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

      //if (isStageDone) {

      //}
      const newStatus = isStageDone ? StageStatus.Finished : StageStatus.None;
      promises.push(updateStageStatus({ uid, projectId, stagePath, status: newStatus }));

      // TODO: figure out next stagePath!?

      //promises.push(set_activeStagePath({projectId}, ));
    }

    return Promise.all(promises);
  },

  updateStageStatus(
    { uid, projectId, stagePath, status },
    { stageStatusRaw, stageFinishTime, force_activeStagePath, force_nextStagePath },
    { },
    { updateStageStatus, updateProjectStatus, update_db, set_activeStagePath }) {
    const updates = {};

    // TODO: generate notification entry
    // TODO: generalize batch writing through updates

    // update this status
    updates[stageStatusRaw.getPath({ projectId, stagePath })] = status;
    updates[stageFinishTime.getPath({ projectId, stagePath })] = firebase.database.ServerValue.TIMESTAMP;

    const promises = [];

    const node = projectStageTree.getNodeByPath(stagePath);
    const activeStagePath = force_activeStagePath({ projectId });
    
    // update activeStagePath
    if (isStageStatusOver(status) && activeStagePath === stagePath) {
      const nextStagePath = force_nextStagePath({ projectId, stagePath });
      updates[force_activeStagePath.getPath({ projectId })] = nextStagePath;
    }

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
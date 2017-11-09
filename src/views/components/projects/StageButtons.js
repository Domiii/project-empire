import {
  projectStageTree,
  StageStatus,
  StageContributorStatus,
  isStageStatusOver
} from 'src/core/projects/ProjectDef';

import React from 'react';
import PropTypes from 'prop-types';

import {
  Panel, Button, Alert, Well
} from 'react-bootstrap';

import dataBind from 'src/dbdi/react/dataBind';

import FAIcon from 'src/views/components/util/FAIcon';
import LoadIndicator from 'src/views/components/util/loading';


function getToggleStatus(oldStatus) {
  const isDone = isStageStatusOver(oldStatus);
  return isDone ? StageStatus.None : StageStatus.Finished;
}

const CustomStageButtons = {
  sprintMeeting: dataBind()(function sprintMeeting(
    {},
    {},
    {}
  ) {

  })
};

const StageButtons = dataBind({
  toggleStageStatus(evt, { thisProjectId, thisStagePath },
    { get_stageStatus, updateStageStatus }) {
    const projectId = thisProjectId;
    const stagePath = thisStagePath;
    const oldStatus = get_stageStatus({ projectId, stagePath }) || StageStatus.None;

    const newStatus = getToggleStatus(oldStatus);
    updateStageStatus({ projectId: thisProjectId, stagePath }, newStatus);
  },

  setNone(evt, { thisProjectId, thisStagePath },
    { updateStageStatus },
    { currentUid }) {
    const uid = currentUid;
    const projectId = thisProjectId;
    const stagePath = thisStagePath;
    updateStageStatus({ projectId, uid, stagePath, status: StageStatus.None });
  },
  setFinished(evt, { thisProjectId, thisStagePath },
    { updateStageStatus },
    { currentUid }) {
    const uid = currentUid;
    const projectId = thisProjectId;
    const stagePath = thisStagePath;
    updateStageStatus({ projectId, uid, stagePath, status: StageStatus.Finished });
  },
  setFailed(evt, { thisProjectId, thisStagePath },
    { updateStageStatus },
    { currentUid }) {
    const uid = currentUid;
    const projectId = thisProjectId;
    const stagePath = thisStagePath;
    updateStageStatus({ projectId, uid, stagePath, status: StageStatus.Failed });
  },

  setContributorNone(evt, { thisProjectId, thisStagePath },
    { updateStageContributorStatus },
    { currentUid }) {
    const uid = currentUid;
    const projectId = thisProjectId;
    const stagePath = thisStagePath;
    const newStatus = StageContributorStatus.None;
    updateStageContributorStatus({ uid, projectId, stagePath, newStatus });
  },
  setContributorFinished(evt, { thisProjectId, thisStagePath },
    { updateStageContributorStatus },
    { currentUid }) {

    const uid = currentUid;
    const projectId = thisProjectId;
    const stagePath = thisStagePath;
    const newStatus = StageContributorStatus.Finished;
    updateStageContributorStatus({ uid, projectId, stagePath, newStatus });
  },
  setContributorFailed(evt, { thisProjectId, thisStagePath },
    { updateStageContributorStatus },
    { currentUid }) {

    const uid = currentUid;
    const projectId = thisProjectId;
    const stagePath = thisStagePath;
    const newStatus = StageContributorStatus.Failed;
    updateStageContributorStatus({ uid, projectId, stagePath, newStatus });
  }
})(
  ({ thisProjectId, thisStagePath }, {
    stageContributions,
    get_isStageContributor,
    get_hasStageReviewerPrivilege,
    setFinished, setNone, setFailed,
    setContributorFinished, setContributorNone
  }, {
    currentUid
  }) => {
    const stagePath = thisStagePath;
    const stageNode = projectStageTree.getNodeByPath(stagePath);
    const uid = currentUid;
    const projectId = thisProjectId;

    const queryArgs = { uid, projectId, stagePath };
    const canReview = get_hasStageReviewerPrivilege(queryArgs);
    const isStageContributor = get_isStageContributor(queryArgs);
    if (!canReview && !isStageContributor) {
      // nothing to do here
      return <span />;
    }

    // we need this in order to be able to press the buttons
    if (!stageContributions.isLoaded({ projectId, stagePath })) {
      return (<LoadIndicator block />);
    }


    return (<div>
      {!stageNode.hasChildren &&
        <div className="right-bound">
          {isStageContributor &&
            <div>
              <Button onClick={setContributorNone} bsStyle="info">
                <FAIcon name="undo" /> Reset
              </Button>

              <Button onClick={setContributorFinished} bsStyle="success">
                <FAIcon name="check" /> Done
              </Button>
            </div>
          }

          {canReview &&
            <div>
              <Button onClick={setNone} bsStyle="info">
                Reset stage
              </Button>

              <Button onClick={setFinished} bsStyle="success">
                Finish stage
              </Button>

              <Button onClick={setFailed} bsStyle="danger">
                Fail stage
              </Button>
            </div>
          }
        </div>
      }
    </div>);
  }
  );
StageButtons.propTypes = {
  //previousStagePath: PropTypes.string
};

export default StageButtons;
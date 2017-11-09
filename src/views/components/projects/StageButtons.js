import {
  projectStageTree,
  StageStatus,
  StageContributorStatus,
  isStageStatusOver,
  isProjectStatusOver
} from 'src/core/projects/ProjectDef';

import {
  pathGetStageId,
  pathToParent
} from 'src/core/projects/ProjectPath';

import React from 'react';
import PropTypes from 'prop-types';

import {
  Panel, Button, Alert, Well
} from 'react-bootstrap';
import Flexbox from 'flexbox-react';

import dataBind from 'src/dbdi/react/dataBind';

import FAIcon from 'src/views/components/util/FAIcon';
import LoadIndicator from 'src/views/components/util/loading';


function getToggleStatus(oldStatus) {
  const isDone = isStageStatusOver(oldStatus);
  return isDone ? StageStatus.None : StageStatus.Finished;
}

const defaultButtonActions = {
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
};

const CustomStageButtons = {
  sprintMeeting: dataBind({
    ...defaultButtonActions,
    finishProject(evt, { }) {
      // TODO
    },
    addSprint(evt, { thisProjectId, thisStagePath },
      { addStageIteration },
      { currentUid }) {
      // TODO: also update contributor status
      const uid = currentUid;
      const projectId = thisProjectId;
      const stagePath = pathToParent(thisStagePath);
      return addStageIteration({ uid, projectId, stagePath });
    },
    cancelProject(evt, { }) {
      // TODO: 
    }
  })(function sprintMeeting(
    { thisProjectId, thisStagePath }, {
      stageContributions,
      get_hasStageReviewerPrivilege,
      get_stageStatus,
      get_projectStatus, get_activeStagePath,
      finishProject, addSprint, cancelProject
    }, {
      currentUid
    }
  ) {
    const stagePath = thisStagePath;
    const uid = currentUid;
    const projectId = thisProjectId;
    const queryArgs = { uid, projectId, stagePath };
    const canReview = get_hasStageReviewerPrivilege(queryArgs);
    const projectStatus = get_projectStatus({ projectId });
    const isActiveLeaf = stagePath === get_activeStagePath({ projectId });
    const stageStatus = get_stageStatus({ projectId, stagePath }) || StageStatus.None;

    // we need this in order to be able to press the buttons
    if (!stageContributions.isLoaded({ projectId, stagePath }) ||
      !get_projectStatus.isLoaded({ projectId }) ||
      !get_activeStagePath.isLoaded({ projectId }) ||
      !get_stageStatus.isLoaded({ projectId, stagePath })) {
      return (<LoadIndicator block />);
    }

    const hasProjectFinished = isProjectStatusOver(projectStatus);
    const hasStageFinished = isStageStatusOver(stageStatus);

    if (canReview && isActiveLeaf && !hasProjectFinished && !hasStageFinished) {
      // reviewer determines fate of project
      return (<Flexbox>
        <Button block className="no-margin" onClick={finishProject} bsStyle="success">
          <FAIcon name="check" /> Project has been completed
        </Button>

        <Button block className="no-margin" onClick={addSprint} bsStyle="primary">
          <FAIcon name="play" /> Project needs more work
        </Button>

        <Button block className="no-margin" onClick={cancelProject} bsStyle="danger">
          <FAIcon name="remove" /> Project has been cancelled
        </Button>
      </Flexbox>);
    }
    else {
      const props = { thisProjectId, thisStagePath };
      return <DefaultStageButtons {...props} />;
    }
  })
};

const DefaultStageButtons = dataBind({
  ...defaultButtonActions
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
DefaultStageButtons.propTypes = {
  //previousStagePath: PropTypes.string
};

const StageButtons = dataBind()(
  ({ thisStagePath }, { getProps }) => {
    const props = getProps();
    const stageId = pathGetStageId(thisStagePath);
    let Comp = CustomStageButtons[stageId];
    if (!Comp) {
      Comp = DefaultStageButtons;
    }
    return <Comp {...props} />;
  }
);
StageButtons.propTypes = {
  //previousStagePath: PropTypes.string
};

export default StageButtons;
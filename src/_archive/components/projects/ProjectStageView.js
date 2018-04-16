import {
  StageStatus,
  isStageStatusOver,
  isProjectStatusOver
} from 'src/core/projects/ProjectDef';

import {
  stageStatusBsStyles
} from './projectRenderSettings';

import React from 'react';
import PropTypes from 'prop-types';
import Flexbox from 'flexbox-react';

import {
  Panel, Button, Alert, Well
} from 'react-bootstrap';

import dataBind from 'src/dbdi/react/dataBind';

import StageContributorStatusList from './StageContributorStatusList';
import StageButtons from './StageButtons';
import StageContent from './StageContent';



const ProjectStageView = dataBind({
})((
  { thisNode, thisStagePath, thisProjectId },
  { get_projectStatus, get_stageEntry, isAscendantOfActiveStage },
  { }
) => {
  const stageDef = thisNode.stageDef;
  const stagePath = thisStagePath;

  const { title } = stageDef;
  const projectId = thisProjectId;
  const stageEntry = get_stageEntry({ projectId, stagePath });
  const stageStatus = stageEntry && stageEntry.status || StageStatus.None;
  const isActive = isAscendantOfActiveStage({ projectId, stagePath });
  const hasStageFinished = isStageStatusOver(stageStatus);
  const projectStatus = get_projectStatus({ projectId });
  const hasProjectFinished = isProjectStatusOver(projectStatus);

  let bsStyle;
  if (isActive) {
    bsStyle = stageStatusBsStyles[stageStatus];
  }
  else {
    bsStyle = 'default';
  }

  const header = (
    <Flexbox justifyContent="space-between" alignItems="center">
      <Flexbox>
        <span>{`${title}`}</span>
      </Flexbox>
      <Flexbox>
        <StageContributorStatusList />
      </Flexbox>
    </Flexbox>
  );


  ///className="full-width no-margin no-shadow no-border project-stage-panel"

  let alertEl;
  if (hasProjectFinished) {
    alertEl = (<Alert bsStyle="warning">
      This project has already finished.
    </Alert>);
  }
  else if (hasStageFinished) {
    alertEl = (<Alert bsStyle="warning">
      This stage has already finished.
    </Alert>);
  }
  else if (!isActive) {
    alertEl = (<Alert bsStyle="warning">
      This stage has not started yet.
    </Alert>);
  }
  return (
    <Panel
      className="full-width no-margin project-stage-panel"
      bsStyle={bsStyle}>
      <Panel.Heading>
        {header}
      </Panel.Heading>
      <Panel.Body>
        {alertEl}
        {(isActive || hasStageFinished || hasProjectFinished) &&
          <StageButtons />
        }
        <StageContent />
      </Panel.Body>
    </Panel>
  );
});
ProjectStageView.propTypes = {
};

export default ProjectStageView;
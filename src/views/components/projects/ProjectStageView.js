import {
  StageStatus,
  isStageStatusOver
} from 'src/core/projects/ProjectDef';

import {
  stageStatusBsStyles
} from './stageRenderSettings';

import React from 'react';
import PropTypes from 'prop-types';
import Flexbox from 'flexbox-react';

import {
  Panel, Button, Alert, Well
} from 'react-bootstrap';

import dataBind from 'src/dbdi/react/dataBind';

import StageStatusBar from './StageStatusBar';
import StageButtons from './StageButtons';
import StageContent from './StageContent';



const ProjectStageView = dataBind({
})((
  { thisNode, thisStagePath, thisProjectId },
  { get_stageStatus, get_stageEntry, isAscendantOfActiveStage },
  { }
) => {
  const stageDef = thisNode.stageDef;
  const stagePath = thisStagePath;

  const { title, order } = stageDef;
  const projectId = thisProjectId;
  const stageEntry = get_stageEntry({ projectId, stagePath });
  const status = stageEntry && stageEntry.status || StageStatus.None;
  const isActive = isAscendantOfActiveStage({ projectId, stagePath });

  let bsStyle;
  if (isActive) {
    bsStyle = stageStatusBsStyles[status];
  }
  else {
    bsStyle = 'default';
  }

  const header = (
    <Flexbox justifyContent="space-between" alignItems="center">
      <Flexbox>
        <span>{`${order + 1}. ${title}`}</span>
      </Flexbox>
      <Flexbox>
        <StageStatusBar />
      </Flexbox>
    </Flexbox>
  );


  ///className="full-width no-margin no-shadow no-border project-stage-panel"


  return (
    <Panel header={header}
      className="full-width no-margin project-stage-panel"
      bsStyle={bsStyle}>
      {isActive &&
        <StageButtons />
      }
      <StageContent />
    </Panel>
  );
});
ProjectStageView.propTypes = {
};

export default ProjectStageView;
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
})(
  ({ thisNode, thisPreviousStagePath, thisStagePath, thisProjectId, children },
    { get_stageStatus, get_stageEntry },
    { }) => {
    const stageDef = thisNode.stageDef;
    const stagePath = thisStagePath;

    if (!stageDef) {
      // root node
      return <div className="full-width">{children}</div>;
    }

    const title = stageDef.title;
    const order = thisNode.order;
    const projectId = thisProjectId;
    const previousStageStatus = get_stageStatus({ projectId, stagePath: thisPreviousStagePath });
    const stageEntry = get_stageEntry({ projectId, stagePath });
    const status = stageEntry && stageEntry.status || StageStatus.None;

    let bsStyle;
    const isActive = thisNode.isFirstChild ||
      //stageEntry ||
      isStageStatusOver(previousStageStatus);

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
        {children}
      </Panel>
    );
  }
  );
ProjectStageView.propTypes = {
};

export default ProjectStageView;
import {
  projectStageTree,
  StageStatus,
  StageContributorStatus,
  isStageStatusOver
} from 'src/core/projects/ProjectDef';

import { EmptyObject, EmptyArray } from 'src/util';

import map from 'lodash/map';

import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import Flexbox from 'flexbox-react';

import {
  Panel, Button, Alert, Well
} from 'react-bootstrap';

import { LinkContainer } from 'react-router-bootstrap';


import { hrefProjectControl } from 'src/views/href';

import dataBind from 'src/dbdi/react/dataBind';

import FAIcon from 'src/views/components/util/FAIcon';

import {
  stageStatusStyles,
  stageStatusBsStyles
} from './stageRenderSettings';


const StageProgressIcon = withRouter(dataBind({
})(function StageProgressIcon(
  { thisProjectId, thisStagePath,
    thisPreviousStagePath, thisNode,
    makeChildren, iteration,
    match },
  { isAscendantOfActiveStage, get_stageStatus, get_stageEntry },
  { }
) {
  const { selectedProjectId, selectedStagePath } = match.params;
  const projectId = thisProjectId;
  const stagePath = thisStagePath;
  const previousStagePath = thisPreviousStagePath;
  const isActiveStage = isAscendantOfActiveStage({ projectId, stagePath });
  const isSelectedStage = selectedProjectId === projectId && selectedStagePath === stagePath;
  const previousStatus = previousStagePath && get_stageStatus({ projectId, stagePath: previousStagePath });
  const stageEntry = get_stageEntry({ projectId, stagePath });
  const stageStatus = stageEntry && stageEntry.status || StageStatus.None;
  const hasStageStarted = !previousStagePath || isStageStatusOver(previousStatus);
  const hasStageFinished = isStageStatusOver(stageStatus);

  let bsStyle;
  if (hasStageStarted) {
    bsStyle = stageStatusBsStyles[stageStatus];
  }
  else {
    bsStyle = 'default';
  }

  const renderChildren = makeChildren && 
    hasStageStarted && !hasStageFinished || isSelectedStage;

  let className = '';
  if (thisNode.isRoot) {
    className = 'root';
  }
  else if (isActiveStage) {
    className = 'active';
  }
  else if (renderChildren) {
    className = 'with-children';
  }

  const { stageDef } = thisNode;

  let iconEl;
  if (!thisNode.isRoot && !renderChildren) {
    const { shortTitle, title } = stageDef;
    const iterationInfo = !isNaN(iteration) && '#' + (iteration + 1) || '';
    iconEl =
      //(<span>{thisNode.stageId.charAt(0).toUpperCase()}</span>);
      (<LinkContainer to={hrefProjectControl(projectId, stagePath)}>
        <Button bsStyle={bsStyle}>
          <span>{`${shortTitle || title} ${iterationInfo}`}</span>
        </Button>
      </LinkContainer>);
  }

  return (
    <div className={'stage-progress-icon ' + className}>
      {iconEl}
      {renderChildren &&
        <Flexbox className="stage-progress-bar full-width"
          flexDirection="row" alignItems="center" justifyContent="center">
          {makeChildren()}
        </Flexbox>
      }
    </div>
  );
}));

const ProjectProgressBar = dataBind({

})(function ProjectProgressBar(
  { thisProjectId }, { get_stageEntries }
) {
  const stageEntries = get_stageEntries({ projectId: thisProjectId });
  return (<div className="stage-progress-bar-container">
    {projectStageTree.traverse(stageEntries, renderStageNode)}
  </div>);
});

function renderStageNode(node, previousStagePath, stagePath, stageEntry, makeChildren, iteration) {
  const newContext = {
    thisStagePath: stagePath,
    thisPreviousStagePath: previousStagePath,
    thisNode: node
  };

  const stageEl = (<StageProgressIcon key={stagePath}
    setContext={newContext} makeChildren={makeChildren}
    iteration={iteration} />);

  return !!node.next &&
    // yes arrow
    [
      stageEl,
      <ProjectStageArrow key={'arrow_' + stagePath} previousStagePath={stagePath} />
    ] ||

    // no arrow
    stageEl;
}



const ProjectStageArrow = dataBind()(
  ({ thisProjectId, previousStagePath }, { get_stageStatus }) => {
    const projectId = thisProjectId;
    const stageStatus = get_stageStatus({ projectId, stagePath: previousStagePath });
    const status = stageStatus || StageStatus.None;
    const style = stageStatusStyles[status];
    return (<FAIcon name="arrow-right" size="1em" style={style} />);
  }
);


export default ProjectProgressBar;
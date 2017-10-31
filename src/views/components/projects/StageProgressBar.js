import map from 'lodash/map';

import React from 'react';
import PropTypes from 'prop-types';

import Flexbox from 'flexbox-react';

import dataBind from 'src/dbdi/react/dataBind';


const StageProgressIcon = dataBind({

})(function StageProgressIcon(
  { },
  { },
  { }
) {
  
});

const StageProgressBar = dataBind({

})(function StageProgressBar(
  { thisProjectId }, { get_stageEntries }
) {
  const stageEntries = get_stageEntries({ projectId: thisProjectId });
  return (
    <Flexbox key={stagePath} className="stage-progress-bar full-width"
      data-name="ProjectTree"
      flexDirection="row" alignItems="center" justifyContent="center">
      {projectStageTree.traverse(stageEntries, renderStageNode)}
    </Flexbox>
  );
});



const ProjectStageArrow = dataBind()(
  ({ thisProjectId, previousStagePath }, { get_stageStatus }) => {
    const projectId = thisProjectId;
    const stageStatus = get_stageStatus({ projectId, stagePath: previousStagePath });
    const status = stageStatus || StageStatus.None;
    const style = stageStatusStyles[status];
    return (<FAIcon name="arrow-down" size="4em" style={style} />);
  }
);

function renderStageNode(node, previousStagePath, stagePath, stageEntry, children) {
  const stageEl = (<ProjectStageView
    key={stagePath}
    setContext={{
      thisStagePath: stagePath,
      thisPreviousStagePath: previousStagePath,
      thisNode: node
    }}>
    {children}
  </ProjectStageView>);
  
  
  return !!node.next &&
    // yes arrow
    [
      stageEl,
      <ProjectStageArrow key={'arrow_' + stagePath} previousStagePath={stagePath} />
    ] || 

    // no arrow
    stageEl;
}


export default StageProgressBar;
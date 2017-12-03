import {
  projectStageTree,
  StageStatus,
  StageContributorStatus,
  isStageStatusOver
} from 'src/core/projects/ProjectDef';

import {
  stageStatusStyles
} from './stageRenderSettings';

import React from 'react';
import PropTypes from 'prop-types';
import Flexbox from 'flexbox-react';

import dataBind from 'src/dbdi/react/dataBind';

import FAIcon from 'src/views/components/util/FAIcon';

import ProjectStageView from './ProjectStageView';


// const customStageRenderers = {
//   prepare(node, previousPath, path, stageEntry, children) {

//   },
//   sprint(node, previousPath, path, stageEntry, children, iteration) {

//   },
//   execution(node, previousPath, path, stageEntry, children) {

//   },
//   partyPrepareMeeting(node, previousPath, path, stageEntry, children) {

//   },
//   reviewerPrepareMeeting(node, previousPath, path, stageEntry, children) {

//   },
//   holdMeeting(node, previousPath, path, stageEntry, children) {

//   },
//   postSprintReflection(node, previousPath, path, stageEntry, children) {

//   },
//   wrapup(node, previousPath, path, stageEntry, children) {

//   },
// };

const ProjectStageArrow = dataBind()(
  ({ thisProjectId, previousStagePath }, { get_stageStatus }) => {
    const projectId = thisProjectId;
    const stageStatus = get_stageStatus({ projectId, stagePath: previousStagePath });
    const status = stageStatus || StageStatus.None;
    const style = stageStatusStyles[status];
    return (<FAIcon name="arrow-down" size="4em" style={style} />);
  }
);
const ProjectTree = dataBind()(
  ({ thisProjectId }, { get_stageEntries }) => {
    const stageEntries = get_stageEntries({ projectId: thisProjectId });
    return (<div className="full-width" data-name="ProjectTree">
      {projectStageTree.traverse(stageEntries, renderStageNode)}
    </div>);
  }
);

function renderStageNode(node, previousStagePath, stagePath, stageEntry, children) {
  return (
    <Flexbox key={stagePath} className="full-width"
      flexDirection="column"
      justifyContent="center" alignItems="center">
      <Flexbox className="full-width">
        <ProjectStageView
          setContext={{
            thisStagePath: stagePath,
            thisPreviousStagePath: previousStagePath,
            thisNode: node
          }}>
          {children}
        </ProjectStageView>
      </Flexbox>
      {!!node.next &&
        <Flexbox style={{ display: 'flex' }} justifyContent="center">
          <ProjectStageArrow previousStagePath={stagePath} />
        </Flexbox>
      }
    </Flexbox>
  );
}

export default ProjectTree;
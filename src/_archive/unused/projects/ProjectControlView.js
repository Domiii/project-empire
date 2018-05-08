import {
  projectStageTree
} from 'src/core/projects/ProjectDef';

import React from 'react';
import PropTypes from 'prop-types';

import dataBind from 'src/dbdi/react/dataBind';

import LoadIndicator from 'src/views/components/util/loading';

import ProjectStageView from './ProjectStageView';
//import ProjectTree from './ProjectTree';
import ProjectProgressBar from './ProjectProgressBar';


const ProjectControlView = dataBind()(
  (
    { projectId, selectedStagePath },
    { projectById, get_stageEntries }
  ) => {
    if (!projectById.isLoaded({ projectId }) |
      !get_stageEntries.isLoaded({ projectId })) {
      return (<LoadIndicator block />);
    }
    const thisProject = projectById({ projectId });

    const newContext = {
      thisProjectId: projectId,
      thisProject
    };

    return (<div>
      <ProjectProgressBar setContext={newContext} />
      {selectedStagePath &&
        <ProjectStageView key={selectedStagePath} setContext={{
          thisProjectId: projectId,
          thisStagePath: selectedStagePath,
          thisNode: projectStageTree.getNodeByPath(selectedStagePath)
        }} />
      }
    </div>);
  }
);

export default ProjectControlView;
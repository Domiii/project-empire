import {
  projectStageTree
} from 'src/core/projects/ProjectDef';

import {
  pathToChild,
  isAscendantPath
} from 'src/core/projects/ProjectPath';

import { EmptyObject, EmptyArray } from 'src/util';

import map from 'lodash/map';
import isEmpty from 'lodash/isEmpty';
import size from 'lodash/size';
import times from 'lodash/times';

import React from 'react';
import PropTypes from 'prop-types';
import { Redirect, withRouter } from 'react-router-dom';
import Flexbox from 'flexbox-react';

import {
  Panel, Button, Alert, Well
} from 'react-bootstrap';

import { hrefProjectControl } from 'src/views/href';

import dataBind from 'src/dbdi/react/dataBind';

import LoadIndicator from 'src/views/components/util/loading';

import { MissionHeader } from './ProjectPreview';
import ProjectStageView from './ProjectStageView';
//import ProjectTree from './ProjectTree';
import ProjectProgressBar from './ProjectProgressBar';


export const ProjectControlView = dataBind()(
  ({ projectId, selectedStagePath }, { projectById, get_stageEntries }) => {
    if (!projectById.isLoaded({ projectId }) |
      !get_stageEntries.isLoaded({ projectId })) {
      return (<LoadIndicator block />);
    }

    const thisProject = projectById({ projectId });
    const newContext = {
      thisProjectId: projectId,
      thisProject
    };

    //return <ProjectTree setContext={newContext} />;

    return (<div>
      <Panel header={<MissionHeader missionId={thisProject.missionId} />}>
        <ProjectProgressBar setContext={newContext} />
        {selectedStagePath &&
          <ProjectStageView key={selectedStagePath} setContext={{
            thisProjectId: projectId,
            thisStagePath: selectedStagePath,
            thisNode: projectStageTree.getNodeByPath(selectedStagePath)
          }} />
        }
      </Panel>
    </div>);
  }
);

const ProjectControlList = withRouter(dataBind()((
  { match },
  { activeProjectIdsOfUser, currentUid, get_activeStagePath }
) => {
  const uid = currentUid();
  const { projectId, stagePath } = match.params;

  if (!uid || !activeProjectIdsOfUser.isLoaded({ uid })) {
    return (<LoadIndicator block size={1.5} />);
  }

  const currentProjectIds = activeProjectIdsOfUser({ uid });
  if (isEmpty(currentProjectIds)) {
    return (<Alert bsStyle="warning">
      你目前沒有在進行專案。推薦選擇任務並且找守門人註冊新的～
      </Alert>);
  }
  else {
    let projectEls;

    if (!projectId || !currentProjectIds[projectId]) {
      if (size(currentProjectIds) === 1) {
        // there is only one project → redirect (once loaded)!
        for (let projectId in currentProjectIds) {
          if (!get_activeStagePath.isLoaded({ projectId })) {
            // single project (but not loaded yet)
            return (<LoadIndicator block size={1.5} />);
          }
          return (<Redirect to={hrefProjectControl(projectId, get_activeStagePath({ projectId }))} />);
        }
      }

      // show all projects
      projectEls = map(currentProjectIds, (_, projectId) =>
        (<ProjectControlView data-name="ProjectControlView" key={projectId} projectId={projectId} />)
      );
    }
    else {
      // show selected project
      const node = projectStageTree.getNodeByPath(stagePath);
      if (node.hasChildren) {
        let newStagePath;
        const activeStagePath = get_activeStagePath({ projectId });
        if (isAscendantPath(stagePath, activeStagePath)) {
          // select active path
          newStagePath = activeStagePath;
        }
        else {
          // select first child
          newStagePath = pathToChild(stagePath, node.firstChild.stageId);
        }
        return <Redirect to={hrefProjectControl(projectId, newStagePath)} />;
      }
      projectEls = (<ProjectControlView data-name="ProjectControlView"
        projectId={projectId}
        selectedStagePath={stagePath}
      />);
    }

    return (<div data-name="ProjectControlView" className="full-width">
      {projectEls}
    </div>);
  }
}));

export default ProjectControlList;
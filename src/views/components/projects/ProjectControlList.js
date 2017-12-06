import {
  projectStageTree
} from 'src/core/projects/ProjectDef';

import {
  pathToChild,
  isAscendantPath
} from 'src/core/projects/ProjectPath';

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
import Moment from 'react-moment';

import { hrefProjectControl } from 'src/views/href';

import dataBind from 'src/dbdi/react/dataBind';

import LoadIndicator from 'src/views/components/util/loading';

import ProjectPanel from './ProjectPanel';





function getPreferredSelectedStagePath(get_activeStagePath, projectId, stagePath) {
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
    return newStagePath;
    //return <Redirect to={hrefProjectControl(projectId, newStagePath)} />;
  }
  return stagePath;
}

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
        (<ProjectPanel
          key={projectId} projectId={projectId}
          selectedStagePath={null}
        />)
      );
      //selectedStagePath={getPreferredSelectedStagePath(get_activeStagePath, projectId, stagePath)}
    }
    else {
      // show selected project
      projectEls = (<ProjectPanel
        readonly={false}
        projectId={projectId}
        selectedStagePath={getPreferredSelectedStagePath(get_activeStagePath, projectId, stagePath)}
      />);
    }

    return (<div className="full-width">
      {projectEls}
    </div>);
  }
}));

export default ProjectControlList;
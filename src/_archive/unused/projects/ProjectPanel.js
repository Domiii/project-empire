import {
  ProjectStatus,
  isProjectStatusOver
} from 'src/core/projects/ProjectDef';

import { getOptionalArgument } from 'src/dbdi/dataAccessUtil';

import map from 'lodash/map';
import isEmpty from 'lodash/isEmpty';
import size from 'lodash/size';

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import autoBind from 'react-autobind';

import dataBind from 'src/dbdi/react/dataBind';

import Moment from 'react-moment';
import {
  Alert, Button, Well, Panel
} from 'react-bootstrap';
import Flexbox from 'flexbox-react';


import {
  MissionBody
} from 'src/views/components/missions/MissionView';
import MissionHeader from 'src/views/components/missions/MissionHeader';

import ProjectEditor from './ProjectEditor';
import ProjectEditTools from './ProjectEditTools';
import ProjectTeamList from './ProjectTeamList';
import ProjectControlView from './ProjectControlView';

import UserList from 'src/views/components/users/UserList';
import UserBadge from 'src/views/components/users/UserBadge';

import LoadIndicator from 'src/views/components/util/LoadIndicator';
import { FAIcon } from 'src/views/components/util';


import {
  projectStatusProps
} from './projectRenderSettings';

export const ProjectHeader = dataBind({})(function ProjectHeader(
  { projectId },
  { projectById, get_stageEntries }
) {

  if (!projectById.isLoaded({ projectId }) |
    !get_stageEntries.isLoaded({ projectId })) {
    return (<LoadIndicator block />);
  }

  const thisProject = projectById({ projectId });

  const startTime = thisProject.createdAt;
  const finishTime = thisProject.finishTime;
  const projectStatus = thisProject.status || ProjectStatus.None;
  const hasProjectFinished = isProjectStatusOver(projectStatus);
  const finishStatus = projectStatus === ProjectStatus.Failed ?
    'failed' : 'finished';

  return (
    <Flexbox justifyContent="space-between" alignItems="center">
      <Flexbox>
        <h4><MissionHeader missionId={thisProject.missionId} /></h4>
      </Flexbox>
      {hasProjectFinished && <Flexbox>
        <span className="color-red">{finishStatus}</span>&nbsp;
        <Moment fromNow>{finishTime}</Moment>&nbsp;
        (<Moment format="ddd, MMMM Do YYYY, h:mm:ss a">{finishTime}</Moment>)
      </Flexbox>}
      {!hasProjectFinished && <Flexbox>
        started&nbsp;<Moment fromNow>{startTime}
        </Moment>&nbsp;
        (<Moment format="ddd, MMMM Do YYYY, h:mm:ss a">{startTime}</Moment>)
      </Flexbox>}
      <Flexbox>
        <ProjectTeamList projectId={projectId} />
      </Flexbox>
    </Flexbox>
  );
});
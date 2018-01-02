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
  Alert, Button,
  Well, Panel
} from 'react-bootstrap';
import Flexbox from 'flexbox-react';


import {
  MissionHeader,
  MissionBody
} from 'src/views/components/missions/MissionPanel';

import ProjectEditor from './ProjectEditor';
import ProjectEditTools from './ProjectEditTools';
import ProjectTeamList from './ProjectTeamList';
import ProjectControlView from './ProjectControlView';

import UserList from 'src/views/components/users/UserList';
import UserBadge from 'src/views/components/users/UserBadge';

import LoadIndicator from 'src/views/components/util/loading';
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

@dataBind({

})
export default class ProjectPanel extends Component {
  static propTypes = {
    projectId: PropTypes.string.isRequired,
    readonly: PropTypes.bool
  };

  constructor() {
    super();

    this.state = {
      editing: null
    };

    this.dataBindMethods(
      this.editorHeader
    );

    autoBind(this);
  }

  get IsEditing() {
    return this.state.editing;
  }

  get ShowDetails() {
    return this.state.showDetails;
  }

  toggleShowDetails = () => {
    this.setState({ showDetails: !this.ShowDetails });
  }

  toggleEdit = () => {
    this.setState({
      editing: !this.IsEditing
    });
  }

  editorHeader({ projectId, readonly }, { }, { isCurrentUserGuardian }) {
    const { showDetails } = this.state;
    return (readonly || !isCurrentUserGuardian) ? null : (
      <Flexbox alignItems="center" justifyContent="flex-end">
        <Button onClick={this.toggleShowDetails}
          bsStyle="primary"
          bsSize="small" active={showDetails}>
          <FAIcon name="cubes" />
        </Button>

        <div className="margin-half" />

        <ProjectEditTools {...{
          projectId,

          //changeOrder: 

          editing: this.IsEditing,
          toggleEdit: this.toggleEdit
        }} />
      </Flexbox>
    );
  }

  render(
    args,
    { projectById },
    { }
  ) {
    const {
      projectId
    } = this.props;
    const children = getOptionalArgument(args, 'children');

    if (!projectById.isLoaded({ projectId })) {
      return <LoadIndicator block message="loading project..." />;
    }
    const project = projectById({ projectId });

    if (!project) {
      return (<Alert bsStyle="danger">invalid project id {projectId}</Alert>);
    }

    const {
      missionId,
      status
    } = project;

    return (<div>
      <Panel {...projectStatusProps[status]} header={<ProjectHeader projectId={projectId} />}>
        <div>
          {this.editorHeader()}
          <p>Started by: {
            !project.guardianUid ?
              <span className="color-gray">no guardian</span> :
              <UserBadge uid={project.guardianUid} />
          }</p>

          <div className="margin-half" />

          <MissionBody missionId={missionId} />

          <div className="margin-half" />

          {this.IsEditing && (
            <ProjectEditor {...{ projectId }} />
          )}
          {this.ShowDetails &&
            <ProjectControlView projectId={projectId} />
          }

          {children}
        </div>
      </Panel>
    </div>);
  }
}
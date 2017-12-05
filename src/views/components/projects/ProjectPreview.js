import { hasDisplayRole } from 'src/core/users/Roles';

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


import ProjectEditor from './ProjectEditor';
import ProjectEditTools from './ProjectEditTools';
import { ProjectControlView } from './ProjectControlView';
import UserList from 'src/views/components/users/UserList';
import UserBadge from 'src/views/components/users/UserBadge';
import LoadIndicator from 'src/views/components/util/loading';
import { FAIcon } from 'src/views/components/util';


export const ProjectTeam = dataBind({})(
  ({ projectId }, { uidsOfProject }) => {
    if (!uidsOfProject.isLoaded({ projectId })) {
      return <LoadIndicator />;
    }
    else {
      const uids = Object.keys(uidsOfProject({ projectId }));

      if (isEmpty(uids)) {
        return (<Alert bsStyle="warning" style={{ display: 'inline' }} className="no-padding">
          <span>this project has no team yet</span>
        </Alert>);
      }
      else {
        return (<div>
          <span>Team ({size(uids)}):</span> <UserList uids={uids} />
        </div>);
      }
    }
  }
);

export const MissionHeader = dataBind({})(function MissionHeader(
  { missionId },
  { missionById }
) {
  const isMissionLoaded = missionById.isLoaded({ missionId });
  let missionHeader;
  if (isMissionLoaded) {
    const mission = missionById({ missionId });
    if (mission) {
      missionHeader = `${mission.code} - ${mission.title}`;
    }
    else {
      missionHeader = '<unknown mission>';
    }
  }
  else {
    missionHeader = <LoadIndicator />;
  }

  return missionHeader;
});

@dataBind({

})
export default class ProjectPreview extends Component {
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
        <ProjectEditTools {...{
          projectId,

          //changeOrder: 

          editing: this.IsEditing,
          toggleEdit: this.toggleEdit
        }} />

        <Button onClick={this.toggleShowDetails}
          bsStyle="primary"
          bsSize="small" active={showDetails}>
          <FAIcon name="cubes" />
        </Button>
      </Flexbox>
    );
  }

  render({ }, { projectById, get_missionDescription }, { }) {
    const {
      projectId
    } = this.props;

    if (!projectById.isLoaded({ projectId })) {
      return <LoadIndicator block message="loading project..." />;
    }
    const project = projectById({ projectId });

    if (!project) {
      return (<Alert bsStyle="danger">invalid project id {projectId}</Alert>);
    }

    // mission
    const missionId = project.missionId;
    const isMissionLoaded = get_missionDescription.isLoaded({ missionId });
    let missionEl;
    if (isMissionLoaded) {
      const missionDescription = get_missionDescription({ missionId });
      if (missionDescription) {
        missionEl = (<Well>
          <h4 className="no-margin no-padding">{missionDescription}</h4>
        </Well>);
      }
      else {
        missionEl = (<Alert bsStyle="danger">mission doesn{'\''}t exist (anymore)</Alert>);
      }
    }
    else {
      missionEl = <LoadIndicator block message="loading mission..." />;
    }

    return (<div>
      <h1><MissionHeader missionId={project.missionId} /></h1>
      <Panel header={null} bsStyle="info">
        <div>
          {this.editorHeader()}
          <p>Started: <Moment fromNow>{project.createdAt}</Moment></p>
          <p>Guardian: {
            !project.guardianUid ?
              <span className="color-gray">no guardian</span> :
              <UserBadge uid={project.guardianUid} />
          }</p>
          <p>Reviewer: {
            !project.reviewerUid ?
              <span className="color-gray">no assigned reviewer</span> :
              <UserBadge uid={project.reviewerUid} />
          }</p>

          <ProjectTeam projectId={projectId} />

          <div className="margin-half" />

          {missionEl}

          <div className="margin-half" />

          {this.IsEditing && (
            <ProjectEditor {...{ projectId }} />
          )}
          {this.ShowDetails &&
            <ProjectControlView projectId={projectId} />
          }

        </div>
      </Panel>
    </div>);
  }
}
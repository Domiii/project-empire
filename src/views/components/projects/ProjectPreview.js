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
  Alert, Badge,
  Well, Panel
} from 'react-bootstrap';


import ProjectEditor from './ProjectEditor';
import ProjectEditTools from './ProjectEditTools';
import UserList, { UserBadge } from 'src/views/components/users/UserList';
import LoadIndicator from 'src/views/components/util/loading';


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

    autoBind(this);
  }

  get IsAdmin() {
    const { currentUserRef } = this.context;
    return currentUserRef && currentUserRef.isAdminDisplayMode() || false;
  }

  get IsGuardian() {
    const { currentUserRef } = this.context;
    return hasDisplayRole(currentUserRef, 'Guardian');
  }

  get IsEditing() {
    return this.state.editing;
  }

  toggleEdit() {
    this.setState({
      editing: !this.IsEditing
    });
  }

  editorHeader() {
    const {
      projectId,
      readonly
    } = this.props;

    return (readonly || !this.IsGuardian) ? null : (
      <div>
        <ProjectEditTools {...{
          projectId,

          //changeOrder: 

          editing: this.IsEditing,
          toggleEdit: this.toggleEdit
        }} />
      </div>
    );
  }

  render({ }, { projectById, missionById }, { }) {
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
    const isMissionLoaded = missionById.isLoaded({ missionId: project.missionId });
    const mission = missionById({ missionId: project.missionId });
    let missionEl;
    let missionHeader;
    if (isMissionLoaded) {
      if (mission) {
        missionHeader = `${mission.code} - ${mission.title}`;
        missionEl = (<Well>
          <h4 className="no-margin no-padding">{mission.description}</h4>
        </Well>);
      }
      else {
        missionHeader = '<unknown mission>';
        missionEl = (<Alert bsStyle="danger">mission doesn{'\''}t exist (anymore)</Alert>);
      }
    }
    else {
      missionHeader = <LoadIndicator />;
      missionEl = <LoadIndicator block message="loading mission..." />;
    }

    return (<div>
      <h1>{missionHeader}</h1>
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

          {!this.IsEditing ? null : (
            <ProjectEditor {...{ projectId }} />
          )}
        </div>
      </Panel>
    </div>);
  }
}
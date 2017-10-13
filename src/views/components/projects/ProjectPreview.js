import { hasDisplayRole } from 'src/core/users/Roles';

import map from 'lodash/map';
import isEmpty from 'lodash/isEmpty';
import size from 'lodash/size';

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import autoBind from 'react-autobind';
import Moment from 'react-moment';
import {
  Alert, Badge,
  Well, Panel
} from 'react-bootstrap';


import ProjectEditTools from './ProjectEditTools';
import UserList, { UserBadge } from 'src/views/components/users/UserList';
import LoadIndicator from 'src/views/components/util/loading';


// TODO: render + allow editing of guardianNotes + gmNotes + partyNotes

export default class ProjectPreview extends Component {
  static contextTypes = {
    currentUserRef: PropTypes.object,
    lookupLocalized: PropTypes.func.isRequired
  };

  static propTypes = {
    projectId: PropTypes.string.isRequired,
    project: PropTypes.object.isRequired,
    mission: PropTypes.object,

    users: PropTypes.object,
    projectGuardian: PropTypes.object,
    reviewer: PropTypes.object,

    projectEditor: PropTypes.object,

    deleteProject: PropTypes.func
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

  get EmptyEl() {
    return (
      <Alert bsStyle="warning" style={{ display: 'inline' }} className="no-padding">
        <span>no projects have been added yet</span>
      </Alert>
    );
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
      deleteProject,
      users,
      mission,
      projectEditor
    } = this.props;

    const usersString = map(users, user => user && user.displayName).join(', ');
    const missionInfo = mission && `${mission.code} - ${mission.title}` || 'mission';
    const projectInfo = `${missionInfo} (${usersString})`;
    const canEdit = !!projectEditor;

    return (!canEdit || !this.IsGuardian) ? null : (
      <div>
        <ProjectEditTools {...{
          projectId,
          entryInfo: projectInfo,

          //changeOrder: 

          editing: this.IsEditing,
          toggleEdit: this.toggleEdit,

          deleteEntry: deleteProject
        }} />
      </div>
    );
  }

  render({ }, { project }, { }) {
    const proj = project({ projectId });

    const userEls = isEmpty(users) ?
      this.EmptyEl :
      (<UserList users={users} />);

    //console.log(size(users), users);

    const missionHeader = mission &&
      `${mission.code} - ${mission.title}` ||
      <LoadIndicator />;

    return (<div>
      <h1>{missionHeader}</h1>
      <Panel header={null} bsStyle="info">
        {
          mission && (<div>
            {this.editorHeader()}
            <p>Created: <Moment fromNow>{proj.createdAt}</Moment></p>
            <p>Guardian: {
              !proj.guardianUid ?
                <span className="color-gray">no guardian</span> :
                <UserBadge uid={proj.guardianUid} />
            }</p>
            <p>Reviewer: {
              !proj.reviewerUid ?
                <span className="color-gray">no assigned reviewer</span> :
                <UserBadge uid={proj.reviewerUid} />
            }</p>
            <div>
              <span>Projects ({size(users)}):</span> {userEls}
            </div>
            <div className="margin-half" />
            <Well>
              <h4 className="no-margin no-padding">{mission.description}</h4>
            </Well>
            {!this.IsEditing ? null : projectEditor}
          </div>)
        }
      </Panel>
    </div>);
  }
}
import ProjectsRef, { UserProjectRef } from 'src/core/projects/ProjectsRef';
import MissionsRef from 'src/core/missions/MissionsRef';
import Roles, { hasDisplayRole, isGuardian } from 'src/core/users/Roles';

import isEmpty from 'lodash/isEmpty';
import map from 'lodash/map';
import sortBy from 'lodash/sortBy';

import { EmptyObject, EmptyArray } from 'src/util';

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import autoBind from 'react-autobind';

import dataBind from 'src/dbdi/react/dataBind';

import {
  Button, ListGroup, Alert
} from 'react-bootstrap';
import { Flex, Item } from 'react-flex';
import Select from 'react-select';

import { LoadOverlay } from 'src/views/components/overlays';

import { FAIcon } from 'src/views/components/util';

import ProjectPreview from './ProjectPreview';
import ProjectEditor from './ProjectEditor';

/*

  const userProjectRef = UserProjectRef(firebase);
  const userRef = userProjectRef.refs.user;
  const projectsRef = userProjectRef.refs.project;
  const missionsRef = MissionsRef(firebase);
  const missions = missionsRef.val || EmptyObject;

  return {
    // userInfoRef: UserInfoRef(firebase),
    projects: projectsRef.val,
    missions,
    missionOptions: map(missions, (mission, missionId) => ({
      value: missionId,
      label: `${mission.code} - ${mission.title}`
    })),
    users: userRef.val,
    //userProjectRef,

    addProject: project => {
      project.createdAt = getFirebase().database.ServerValue.TIMESTAMP;
      return projectsRef.push_project(project);
    },
    setProject: projectsRef.set_project,
    deleteProject: projectsRef.delete_project,

    getUsersByProject: userProjectRef.get_user_by_project,
    findUnassignedUsers: userProjectRef.findUnassigned_user_entries,
    addUserToProject: userProjectRef.addEntry,
    deleteUserFromProject: userProjectRef.deleteEntry
  };
}
*/

@dataBind({
  missionOptions({ }, { }, { allMissions }) {
    return allMissions && map(allMissions, (mission, missionId) => ({
      value: missionId,
      label: `${mission.code} - ${mission.title}`
    }));
  }
})
export default class ProjectList extends Component {
  constructor() {
    super();

    this.state = {
      adding: false,
      page: 0
    };

    this.dataBindMethods(
      this.addNewProject,
      this.onSelectedMissionChanged,
      this.makeMissionSelectEl,
      this.makeEditorHeader,
      this.makeProjectsList
    );

    autoBind(this);
  }

  get IsAdding() {
    return this.state.adding;
  }

  get CurrentPage() {
    return this.stage.page;
  }

  get ProjectListArgs() {
    return {
      page: this.CurrentPage
    };
  }

  getProjectIds({ }, { sortedProjectIdsOfPage }, { }) {
    return sortedProjectIdsOfPage(this.ProjectListArgs);
  }

  toggleAdding() {
    this.setAdding(!this.state.adding);
  }

  setAdding(adding) {
    this.setState({ adding });
  }

  setPage(page) {
    this.setState({ page });
  }

  addNewProject({ }, { push_project }, { currentUid }) {
    this.setState({ selectedMissionId: null });
    this.setAdding(false);

    return push_project({
      missionId: this.state.selectedMissionId,
      guardianUid: currentUid
    });
  }

  onSelectedMissionChanged(option, { }, { }, { allMissions }) {
    let missionId = option && option.value;

    if (!allMissions[missionId]) {
      missionId = null;
    }
    this.setState({ selectedMissionId: missionId });
  }

  makeMissionSelectEl({ }, { }, { missionOptions }) {
    return (<Select
      value={this.state.selectedMissionId}
      placeholder="select mission"
      options={missionOptions}
      onChange={this.onSelectedMissionChanged}
    />);
  }

  makeEditorHeader({ }, { }, { isCurrentUserGuardian, allMissions }) {
    return !isCurrentUserGuardian ? null : (
      <div>
        <Button active={this.IsAdding}
          bsStyle="success" bsSize="small"
          disabled={isEmpty(allMissions)}
          onClick={this.toggleAdding}>
          <FAIcon name="plus" className="color-green" /> add new project
        </Button>

        {this.IsAdding && <span>
          <Flex row={true} alignItems="start" justifyContent="1" style={{ maxWidth: '400px' }}>
            <Item flexGrow="3">
              {this.makeMissionSelectEl()}
            </Item>
            <Item flexGrow="1">
              <Button block
                bsStyle="success"
                disabled={!this.state.selectedMissionId}
                onClick={this.addNewProject}>
                <FAIcon name="save" className="color-green" /> save new project
                </Button>
            </Item>
          </Flex>
        </span>}
      </div>
    );
  }

  makeProjectEditorEl(projectId) {
    if (!this.IsGuardian) {
      return null;
    }

    return (<ProjectEditor {...{
      projectId
    }} />);
  }

  makeEmptyProjectsEl() {
    return (
      (<Alert bsStyle="warning">
        <span>there are no projects</span>
      </Alert>)
    );
  }

  makeProjectsList({}, {}, {}) {
    const idList = this.getProjectIds();

    return (<ListGroup> {
      map(idList, (projectId) => {

        return (<li key={projectId} className="list-group-item">
          <ProjectPreview {...{
            canEdit: true,
            projectId,
            reviewer: users && users[project.reviewerUid],
            projectGuardian: users && users[project.guardianUid],
            mission: missions && missions[project.missionId],
            //projectsRef,

            deleteProject,

            projectEditor: this.makeProjectEditorEl(projectId)
          }} />
        </li>);
      })
    } </ListGroup>);
  }

  render({ }, { sortedProjectIdsOfPage }, { }) {
    if (!sortedProjectIdsOfPage.isLoaded(this.ProjectListArgs)) {
      // still loading
      return (<LoadOverlay />);
    }

    let projectListEl;
    if (isEmpty(this.getProjectIds())) {
      projectListEl = this.makeEmptyProjectsEl();
    }
    else {
      projectListEl = this.makeProjectsList();
    }

    return (<div>
      {this.makeEditorHeader()}
      {projectListEl}
    </div>);
  }
}
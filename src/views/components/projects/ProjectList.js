import ProjectsRef, { UserProjectRef } from 'src/core/projects/ProjectsRef';
import MissionsRef from 'src/core/missions/MissionsRef';
import { hasDisplayRole } from 'src/core/users/Roles';

import isEmpty from 'lodash/isEmpty';
import map from 'lodash/map';
import sortBy from 'lodash/sortBy';

import { EmptyObject, EmptyArray } from 'src/util';
import { getFirebase } from 'react-redux-firebase';

import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import autoBind from 'react-autobind';
import {
  Button, ListGroup, Alert
} from 'react-bootstrap';

import { Flex, Item } from 'react-flex';

import Select from 'react-select';

import { FAIcon } from 'src/views/components/util';

import ProjectPreview from './ProjectPreview';
import ProjectEditor from './ProjectEditor';


@connect(({ firebase }, props) => {
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
})
export default class ProjectList extends Component {
  static contextTypes = {
    currentUserRef: PropTypes.object
  };

  static propTypes = {
    projects: PropTypes.object,
    missions: PropTypes.object.isRequired,
    users: PropTypes.object,

    addProject: PropTypes.func.isRequired,
    setProject: PropTypes.func.isRequired,
    deleteProject: PropTypes.func.isRequired,

    getUsersByProject: PropTypes.func.isRequired,
    findUnassignedUsers: PropTypes.func.isRequired,
    addUserToProject: PropTypes.func.isRequired,
    deleteUserFromProject: PropTypes.func.isRequired
  };

  constructor() {
    super();

    this.state = {
      adding: false
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

  get IsAdding() {
    return this.state.adding;
  }

  toggleAdding() {
    this.setAdding(!this.state.adding);
  }

  setAdding(adding) {
    this.setState({
      adding
    });
  }

  addNewProject() {
    const { currentUserRef } = this.context;
    const {
      addProject
    } = this.props;

    this.setState({selectedMissionId: null});
    this.setAdding(false);

    return addProject({
      missionId: this.state.selectedMissionId,
      guardianUid: currentUserRef.props.uid
    });
  }

  onSelectedMissionChanged(option) {
    const {
      missions
    } = this.props;

    let missionId = option && option.value;

    if (!missions[missionId]) {
      missionId = null;
    }
    this.setState({selectedMissionId: missionId});
  }

  makeMissionSelectEl() {
    const {
      missionOptions
    } = this.props;

    return (<Select
      value={this.state.selectedMissionId}
      placeholder="select mission"
      options={missionOptions}
      onChange={this.onSelectedMissionChanged}
    />);
  }

  makeEditorHeader() {
    const { missions } = this.props;

    return !this.IsGuardian ? null : (
      <div>
        <Button active={this.IsAdding}
          bsStyle="success" bsSize="small"
          disabled={isEmpty(missions)}
          onClick={this.toggleAdding}>
          <FAIcon name="plus" className="color-green" /> add new project
        </Button>

        { this.IsAdding && <span>
            <Flex row={true} alignItems="start" justifyContent="1" style={{maxWidth: '400px'}}>
              <Item flexGrow="3">
                { this.makeMissionSelectEl() }
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
          </span>
        }
      </div>
    );
  }

  makeProjectEditorEl(projectId, project, existingUsers, addableUsers) {
    if (!this.IsGuardian) {
      return null;
    }

    const {
        setProject,
        addUserToProject,
        deleteUserFromProject
      } = this.props;

    return (<ProjectEditor {...{
      projectId,
      project,
      existingUsers,
      addableUsers,

      setProject: ({projectId, project}) => {
        console.log(projectId, project);
        return setProject(projectId, project);
      },
      addUserToProject,
      deleteUserFromProject
    }} />);
  }

  makeEmptyProjectsEl() {
    return (
        (<Alert bsStyle="warning">
          <span>there are no projects</span>
        </Alert>)
    );
  }

  makeProjectsList() {
    const { 
      projects,
      users,
      missions,

      findUnassignedUsers,
      getUsersByProject,
      deleteProject
    } = this.props;

    const idList = sortBy(Object.keys(projects), 
      projectId => -projects[projectId].updatedAt);
    const addableUsers = findUnassignedUsers();

    return (<ListGroup> {
      map(idList, (projectId) => {
        const project = projects[projectId];
        let existingUsers = getUsersByProject(projectId);

        return (<li key={projectId} className="list-group-item">
          <ProjectPreview
          {...{
            canEdit: true,
            projectId,
            project,
            assignedGM: users && users[project.assignedGMUid],
            projectGuardian: users && users[project.guardianUid],
            mission: missions && missions[project.missionId],

            users: existingUsers,
            //projectsRef,

            deleteProject,

            projectEditor: this.makeProjectEditorEl(
              projectId, project,
              existingUsers, addableUsers)
          }} />
        </li>);
      })
    } </ListGroup>);
  }

  render() {
    const { 
      projects,

      //userInfoRef,
      //projectsRef,

      setProject,
      deleteProject,

      getUsersByProject,

      addUserToProject,
      deleteUserFromProject
    } = this.props;


    let projectListEl;
    if (isEmpty(projects)) {
      projectListEl = this.makeEmptyProjectsEl();
    }
    else {
      projectListEl = this.makeProjectsList();
    }

    return (<div>
      { this.makeEditorHeader() }
      { projectListEl }
    </div>);
  }
}
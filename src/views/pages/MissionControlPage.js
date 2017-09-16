import ProjectsRef, { UserProjectRef } from 'src/core/projects/ProjectsRef';
import UserInfoRef from 'src/core/users/UserInfoRef';
import MissionsRef from 'src/core/missions/MissionsRef';
import MeetingsRef from 'src/core/projects/MeetingsRef';

import map from 'lodash/map';
import mapValues from 'lodash/mapValues';

import { EmptyObject, EmptyArray } from 'src/util';

import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { helpers, firebaseConnect } from 'react-redux-firebase';
import { 
  Alert, Button, Jumbotron, Well, Panel, Badge
} from 'react-bootstrap';

import autoBind from 'react-autobind';
import {
  LinkContainer
} from 'react-router-bootstrap';
import { LoadOverlay } from 'src/views/components/overlays';
import { FAIcon } from 'src/views/components/util';

import ProjectView from 'src/views/components/projects/ProjectView';
import ProjectControlView from 'src/views/components/projects/ProjectControlView';
import { ProjectMeetingPanel } from 'src/views/components/projects/MeetingView';
import { UserBadge } from 'src/views/components/users/UserList';

const {
  isLoaded
} = helpers;


const ProjectStatus = {
  None: 0,
  Prep: 1,
  Go: 2,
  WrapUp: 3,
  Done: 4
};

// TODO: add "project prep" or "project first steps" to help the team hit the ground running


@connect(({ firebase }, props) => {
  const auth = firebase.auth;
  const currentUid = auth && auth.uid;

  const userProjectRef = UserProjectRef(firebase);

  const u2aIdx = userProjectRef.indexRefs.user.val;
  let currentProjectId, meetingsRef, missionsRef;
  if (!!u2aIdx) {
    const projectIds = u2aIdx[currentUid] && Object.keys(u2aIdx[currentUid]);

    currentProjectId = projectIds && projectIds[0] || null;

    if (currentProjectId) {
      // get ready for project-related data
      missionsRef = MissionsRef(firebase);
      meetingsRef = MeetingsRef(firebase);
    }
  }

  const projectsRef = userProjectRef.refs.project;
  const isReady = currentUid && userProjectRef.indexRefs.user.isLoaded;

  return {
    currentUid,
    currentProjectId,
    
    isReady,

    users: userProjectRef.refs.user.val,
    projects: projectsRef.val,
    
    missions: missionsRef && missionsRef.val,
    meetings: meetingsRef && meetingsRef.val,
    
    u2aIdx,
    a2uIdx: userProjectRef.indexRefs.project.val,

    getUsersByProject: userProjectRef.get_user_by_project
  };
})
@firebaseConnect((props, firebase) => {
  const {
    currentUid,
    currentProjectId,
    projects
  } = props;

  if (!!currentUid) {
    const paths = [
      UserInfoRef.userList.makeQuery(),
      ProjectsRef.makeQuery()
    ];

    const currentProject = projects && projects[currentProjectId];
    if (!!currentProject) {
      // get project-related data
      paths.push(
        MissionsRef.makeQuery(currentProject.missionId),
        MeetingsRef.makeQuery({projectId: currentProjectId})
      );
    }

    UserProjectRef.addIndexQueries(paths, {
      user: [currentUid]
    });
    //console.log(paths, props.projects);
    return paths;
  }
  else {
    return EmptyArray;
  }
})
export default class MissionControlPage extends Component {
  static contextTypes = {
    currentUserRef: PropTypes.object.isRequired
  };

  static propTypes = {

  };

  constructor(...args) {
    super(...args);

    autoBind(this);
  }

  get IsAdmin() {
    const { currentUserRef } = this.context;
    return currentUserRef && currentUserRef.isAdminDisplayMode() || false;
  }

  get CurrentUserUid() {
    const { currentUserRef } = this.context;
    return currentUserRef && currentUserRef.props.uid;
  }

  renderMeetings(projectData) {
    const {
      meetings
    } = this.props;

    return (<ProjectMeetingPanel 
      {...projectData}
      partyMembers={projectData.users}
      meetings={meetings}
            />);
  }

  render() {
    const {
      isReady,
      currentProjectId,
      children,
      users,
      projects,
      missions,
      u2aIdx,
      a2uIdx,

      userProjectRef,
      getUsersByProject
    } = this.props;

    if (!isReady) {
      // still loading
      return (<LoadOverlay />);
    }

    // TODO: 冒險者可以看到自己所有的 project


    let currentProjectOverview;
    
    const project = projects && projects[currentProjectId];
    if (project) {
      let existingUsers = getUsersByProject(currentProjectId);


      // TODO: render stuff based on current status
      const projectStatus = ProjectStatus.Go;
      const projectData = {
        projectId: currentProjectId,
        project,
        users: existingUsers,
        assignedGM: users && users[project.assignedGMUid],
        projectGuardian: users && users[project.guardianUid],

        mission: missions && missions[project.missionId]
      };

      currentProjectOverview = (<div>
        <ProjectView {...projectData} />
        { <ProjectControlView /> }
        { /* this.renderMeetings(projectData) */ }
      </div>);
    }
    else {
      currentProjectOverview = (<Alert bsStyle="warning">
        你目前沒有在進行專案。推薦選擇任務並且找守門人註冊新的～
      </Alert>);
    }


    return (
      <div>
        <Panel header="目前的任務">
          { currentProjectOverview }
        </Panel>
        <Panel header="以前做過的任務">
          TODO: project archive
        </Panel>
      </div>
    );
  }
}
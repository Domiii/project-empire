import ProjectsRef, { UserProjectRef } from 'src/core/projects/ProjectsRef';
import UserInfoRef from 'src/core/users/UserInfoRef';
import MissionsRef from 'src/core/missions/MissionsRef';

import { hasDisplayRole } from 'src/core/users/Roles';

import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { firebaseConnect } from 'react-redux-firebase';
import { 
  Alert, Button, Jumbotron, Well, Panel
} from 'react-bootstrap';

import autoBind from 'react-autobind';
import {
  LinkContainer
} from 'react-router-bootstrap';
import { LoadOverlay } from 'src/views/components/overlays';

import ProjectList from 'src/views/components/projects/ProjectList';


@firebaseConnect((props, firebase) => {
  const paths = [
    ProjectsRef.makeQuery(),
    UserInfoRef.userList.makeQuery(),
    MissionsRef.makeQuery()
  ];
  UserProjectRef.addIndexQueries(paths);
  return paths;
})
@connect(({ firebase }, props) => {
  const userProjectRef = UserProjectRef(firebase);
  return {
    projectsRef: userProjectRef.refs.project,
    userInfoRef: userProjectRef.refs.user,
    userProjectRef
  };
})
export default class ProjectPage extends Component {
  static contextTypes = {
    currentUserRef: PropTypes.object.isRequired
  };

  static propTypes = {
    userInfoRef: PropTypes.object.isRequired,
    projectsRef: PropTypes.object.isRequired
  };

  constructor(...args) {
    super(...args);

    autoBind(this);
  }

  get IsNotLoadedYet() {
    const { currentUserRef } = this.context;
    return !currentUserRef || !currentUserRef.isLoaded;
  }

  get IsGuardian() {
    const { currentUserRef } = this.context;
    return hasDisplayRole(currentUserRef, 'Guardian');
  }

  makeGuardianEl() {
    return (hi);
  }

  render() {
    const {
      projectsRef
    } = this.props;

    if (!projectsRef.isLoaded) {
      // still loading
      return (<LoadOverlay />);
    }



        //{ this.IsGuardian && this.makeGuardianEl() }
    return (
      <div>
        <ProjectList projects={projectsRef.val} />
      </div>
    );
  }
}
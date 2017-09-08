import GroupsRef, { UserGroupRef } from 'src/core/groups/GroupsRef';
import UserInfoRef from 'src/core/users/UserInfoRef';

import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { firebaseConnect } from 'react-redux-firebase'
import { 
  Alert, Button, Jumbotron, Well
} from 'react-bootstrap';

import autoBind from 'react-autobind';
import {
  LinkContainer
} from 'react-router-bootstrap';
import { LoadOverlay } from 'src/views/components/overlays';


@firebaseConnect((props, firebase) => {
  // const paths = [
  //   GroupsRef.makeQuery(),
  //   '/users/public'
  // ];
  // UserGroupRef.addIndexQueries(paths);
  return [];
})
@connect(({ firebase }, props) => {
  // const userGroupRef = UserGroupRef(firebase);
  // return {
  //   groupsRef: userGroupRef.refs.group,
  //   userInfoRef: userGroupRef.refs.user,
  //   userGroupRef
  // };
  return {};
})
export default class LandingPage extends Component {
  static contextTypes = {
    currentUserRef: PropTypes.object.isRequired
  };

  constructor(...args) {
    super(...args);

    autoBind(this);
  }

  get IsNotLoadedYet() {
    const { currentUserRef } = this.context;
    return !currentUserRef || !currentUserRef.isLoaded;
  }

  render() {
    if (this.IsNotLoadedYet) {
      // still loading
      return (<LoadOverlay />);
    }

    //console.log(this.context.currentUserRef, this.context.currentUserRef.isAdminDisplayMode());

    return (
      <span>hi!</span>
    );
  }
}
import GroupsRef, { UserGroupRef } from 'src/core/groups/GroupsRef';
import UserInfoRef from 'src/core/users/UserInfoRef';

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { 
  Alert, Button, Jumbotron, Well
} from 'react-bootstrap';

import autoBind from 'react-autobind';
import {
  LinkContainer
} from 'react-router-bootstrap';
import { LoadOverlay } from 'src/views/components/overlays';

import GroupList from 'src/views/components/groups/GroupList';


@dataBind((props, firebase) => {
  const paths = [
    GroupsRef.makeQuery(),
    '/users/public'
  ];
  UserGroupRef.addIndexQueries(paths);
  return paths;
})
@connect(({ firebase }, props) => {
  const userGroupRef = UserGroupRef(firebase);
  return {
    groupsRef: userGroupRef.refs.group,
    userInfoRef: userGroupRef.refs.user,
    userGroupRef
  };
})
class GroupPage extends Component {
  static contextTypes = {
    currentUserRef: PropTypes.object
  };

  static propTypes = {
    userInfoRef: PropTypes.object.isRequired,
    groupsRef: PropTypes.object.isRequired
  };

  constructor(...args) {
    super(...args);

    autoBind(this);
  }

  get IsNotLoadedYet() {
    const { userInfoRef } = this.props;
    return !userInfoRef.isLoaded;
  }

  render() {
    if (this.IsNotLoadedYet) {
      // still loading
      return (<LoadOverlay />);
    }

    //console.log(this.context.currentUserRef, this.context.currentUserRef.isAdminDisplayMode());

    return (
      <GroupList groups={this.props.groupsRef.val} />
    );
  }
}

export default GroupPage;
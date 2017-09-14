import AdventuresRef, { UserAdventureRef } from 'src/core/adventures/AdventuresRef';
import UserInfoRef from 'src/core/users/UserInfoRef';
import MissionsRef from 'src/core/missions/MissionsRef';

import { hasDisplayRole } from 'src/core/users/Roles';

import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { firebaseConnect } from 'react-redux-firebase'
import { 
  Alert, Button, Jumbotron, Well, Panel
} from 'react-bootstrap';

import autoBind from 'react-autobind';
import {
  LinkContainer
} from 'react-router-bootstrap';
import { LoadOverlay } from 'src/views/components/overlays';

import AdventureList from 'src/views/components/adventures/AdventureList';


@firebaseConnect((props, firebase) => {
  const paths = [
    AdventuresRef.makeQuery(),
    UserInfoRef.userList.makeQuery(),
    MissionsRef.makeQuery()
  ];
  UserAdventureRef.addIndexQueries(paths);
  return paths;
})
@connect(({ firebase }, props) => {
  const userAdventureRef = UserAdventureRef(firebase);
  return {
    adventuresRef: userAdventureRef.refs.adventure,
    userInfoRef: userAdventureRef.refs.user,
    userAdventureRef
  };
})
export default class AdventurePage extends Component {
  static contextTypes = {
    currentUserRef: PropTypes.object.isRequired
  };

  static propTypes = {
    userInfoRef: PropTypes.object.isRequired,
    adventuresRef: PropTypes.object.isRequired
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
      children
    } = this.props;

    if (this.IsNotLoadedYet) {
      // still loading
      return (<LoadOverlay />);
    }



        //{ this.IsGuardian && this.makeGuardianEl() }
    return (
      <div>
        <AdventureList adventures={this.props.adventuresRef.val} />
      </div>
    );
  }
}
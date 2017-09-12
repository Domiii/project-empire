import AdventuresRef, { UserAdventureRef } from 'src/core/adventures/AdventuresRef';
import UserInfoRef from 'src/core/users/UserInfoRef';
import MissionsRef from 'src/core/missions/MissionsRef';

import map from 'lodash/map';
import mapValues from 'lodash/mapValues';

import { EmptyObject, EmptyArray } from 'src/util';

import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { firebaseConnect } from 'react-redux-firebase'
import { 
  Alert, Button, Jumbotron, Well, Panel, Badge
} from 'react-bootstrap';

import autoBind from 'react-autobind';
import {
  LinkContainer
} from 'react-router-bootstrap';
import { LoadOverlay } from 'src/views/components/overlays';
import { FAIcon } from 'src/views/components/util';

import AdventureView from 'src/views/components/adventures/AdventureView';
import { AdventureMeetingPanel } from 'src/views/components/adventures/MeetingView';
import { UserBadge } from 'src/views/components/users/UserList';

@connect(({ firebase }, props) => {
  const auth = firebase.auth;
  const currentUid = auth && auth.uid;

  const userAdventureRef = UserAdventureRef(firebase);
  const missionsRef = MissionsRef(firebase);

  return {
    currentUid,
    userAdventureRef,

    users: userAdventureRef.refs.user.val,
    adventures: userAdventureRef.refs.adventure.val,
    missions: missionsRef.val,
    u2aIdx: userAdventureRef.indexRefs.user.val,
    a2uIdx: userAdventureRef.indexRefs.adventure.val,

    getUsersByAdventure: userAdventureRef.get_user_by_adventure
  };
})
@firebaseConnect((props, firebase) => {
  const {
    currentUid,
    userAdventureRef
  } = props;

  if (!!currentUid) {
    const paths = [
      UserInfoRef.userList.makeQuery(),
      AdventuresRef.makeQuery(),
      MissionsRef.makeQuery()
    ];
    UserAdventureRef.addIndexQueries(paths, {
      user: [currentUid]
    });
    //console.log(paths, props.adventures);
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

  get IsNotLoadedYet() {
    const { currentUserRef } = this.context;
    return !currentUserRef || !currentUserRef.isLoaded;
  }

  get CurrentUserUid() {
    const { currentUserRef } = this.context;
    return currentUserRef && currentUserRef.props.uid;
  }

  render() {
    const {
      children,
      users,
      adventures,
      missions,
      u2aIdx,
      a2uIdx,

      getUsersByAdventure
    } = this.props;

    if (this.IsNotLoadedYet) {
      // still loading
      return (<LoadOverlay />);
    }

    // TODO: 冒險者可以看到自己所有的 adventure

    let currentAdventureEl;

    if (u2aIdx && a2uIdx) {
      const adventureIds = Object.keys(u2aIdx[this.CurrentUserUid]);
      const adventureId = adventureIds && adventureIds[0];
      if (adventureId) {
        const adventure = adventures[adventureId];

        let existingUsers = getUsersByAdventure(adventureId);
        existingUsers = existingUsers[adventureId] || EmptyObject;

        console.log(existingUsers);
        currentAdventureEl = (<AdventureView {...{
          adventureId,
          adventure,
          assignedGM: users && users[adventure.assignedGMUid],
          adventureGuardian: users && users[adventure.guardianUid],
          mission: missions && missions[adventure.missionId],
          users: existingUsers,
        }}/>);
      }
      else {
        currentAdventureEl = (<Alert bsStyle="warning">
          你目前沒有在進行任務。可以選擇任務並且找守門人註冊～
        </Alert>);
      }
    }
    else {
      currentAdventureEl = (<span className="color-red">
        <FAIcon name="cog" spinning={true} /> loading...
      </span>);
    }

    return (
      <div>
        <Panel header="目前的任務">
          { currentAdventureEl }
          <AdventureMeetingPanel />
        </Panel>
        <Panel header="以前做過的任務">
          TODO: adventure archive
        </Panel>
      </div>
    );
  }
}
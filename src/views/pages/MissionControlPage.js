import AdventuresRef, { UserAdventureRef } from 'src/core/adventures/AdventuresRef';
import UserInfoRef from 'src/core/users/UserInfoRef';
import MissionsRef from 'src/core/missions/MissionsRef';
import MeetingsRef from 'src/core/adventures/MeetingsRef';

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

import AdventureView from 'src/views/components/adventures/AdventureView';
import { AdventureMeetingPanel } from 'src/views/components/adventures/MeetingView';
import { UserBadge } from 'src/views/components/users/UserList';

const {
  isLoaded
} = helpers;


const AdventureStatus = {
  None: 0,
  Prep: 1,
  Go: 2,
  WrapUp: 3,
  Done: 4
};

// TODO: add "adventure prep" or "adventure first steps" to help the team hit the ground running


@connect(({ firebase }, props) => {
  const auth = firebase.auth;
  const currentUid = auth && auth.uid;

  const userAdventureRef = UserAdventureRef(firebase);

  const u2aIdx = userAdventureRef.indexRefs.user.val;
  let currentAdventureId, meetingsRef, missionsRef;
  if (!!u2aIdx) {
    const adventureIds = u2aIdx[currentUid] && Object.keys(u2aIdx[currentUid]);

    currentAdventureId = adventureIds && adventureIds[0] || null;

    if (currentAdventureId) {
      // get ready for adventure-related data
      missionsRef = MissionsRef(firebase);
      meetingsRef = MeetingsRef(firebase);
    }
  }

  const adventuresRef = userAdventureRef.refs.adventure;
  const isReady = userAdventureRef.indexRefs.user.isLoaded &&
                    isLoaded(currentAdventureId);

  return {
    currentUid,
    currentAdventureId,
    
    isReady,

    users: userAdventureRef.refs.user.val,
    adventures: adventuresRef.val,
    
    missions: missionsRef && missionsRef.val,
    meetings: meetingsRef && meetingsRef.val,
    
    u2aIdx,
    a2uIdx: userAdventureRef.indexRefs.adventure.val,

    getUsersByAdventure: userAdventureRef.get_user_by_adventure
  };
})
@firebaseConnect((props, firebase) => {
  const {
    currentUid,
    currentAdventureId,
    adventures
  } = props;

  if (!!currentUid) {
    const paths = [
      UserInfoRef.userList.makeQuery(),
      AdventuresRef.makeQuery()
    ];

    const currentAdventure = adventures && adventures[currentAdventureId];
    if (!!currentAdventure) {
      // get adventure-related data
      paths.push(
        MissionsRef.makeQuery(currentAdventure.missionId),
        MeetingsRef.makeQuery({adventureId: currentAdventureId})
      );
    }

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

  get CurrentUserUid() {
    const { currentUserRef } = this.context;
    return currentUserRef && currentUserRef.props.uid;
  }

  renderMeetings(adventureData) {
    const {
      meetings
    } = this.props;

    return (<AdventureMeetingPanel 
      {...adventureData}
      partyMembers={adventureData.users}
      meetings={meetings}
            />);
  }

  render() {
    const {
      isReady,
      currentAdventureId,
      children,
      users,
      adventures,
      missions,
      u2aIdx,
      a2uIdx,

      userAdventureRef,
      getUsersByAdventure
    } = this.props;

    if (!isReady) {
      // still loading
      return (<LoadOverlay />);
    }

    // TODO: 冒險者可以看到自己所有的 adventure


    let currentAdventureOverview;
    
    const adventure = adventures && adventures[currentAdventureId];
    if (adventure) {
      let existingUsers = getUsersByAdventure(currentAdventureId);


      // TODO: render stuff based on current status
      const adventureStatus = AdventureStatus.Go;
      const adventureData = {
        adventureId: currentAdventureId,
        adventure,
        users: existingUsers,
        assignedGM: users && users[adventure.assignedGMUid],
        adventureGuardian: users && users[adventure.guardianUid],

        mission: missions && missions[adventure.missionId]
      };

      currentAdventureOverview = (<div>
        <AdventureView {...adventureData} />
        { /* <AdventurePrepView /> */ }
        { this.renderMeetings(adventureData) }
      </div>);
    }
    else {
      currentAdventureOverview = (<Alert bsStyle="warning">
        你目前沒有在進行任務。可以選擇任務並且找守門人註冊～
      </Alert>);
    }


    return (
      <div>
        <Panel header="目前的任務">
          { currentAdventureOverview }
        </Panel>
        <Panel header="以前做過的任務">
          TODO: adventure archive
        </Panel>
      </div>
    );
  }
}
import AdventuresRef, { UserAdventureRef } from 'src/core/adventures/AdventuresRef';
import UserInfoRef from 'src/core/users/UserInfoRef';
import MissionsRef from 'src/core/missions/MissionsRef';

import map from 'lodash/map';
import mapValues from 'lodash/mapValues';

import {
  helpers
} from 'react-redux-firebase'
const { pathToJS } = helpers;

import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { firebaseConnect } from 'react-redux-firebase'
import { 
  Alert, Button, Jumbotron, Well, Panel
} from 'react-bootstrap';
import { EmptyObject, EmptyArray } from 'src/util';

import autoBind from 'react-autobind';
import {
  LinkContainer
} from 'react-router-bootstrap';
import { LoadOverlay } from 'src/views/components/overlays';


@connect(({ firebase }, props) => {
  const auth = pathToJS(firebase, 'auth');
  const currentUid = auth && auth.uid;

  const userAdventureRef = UserAdventureRef(firebase);

  return {
    currentUid,
    userAdventureRef,

    users: userAdventureRef.refs.user.val,
    adventures: userAdventureRef.refs.adventure.val,
    u2aIdx: userAdventureRef.indexRefs.user.val,
    a2uIdx: userAdventureRef.indexRefs.adventure.val,
  };
})
@firebaseConnect((props, firebase) => {
  const {
    currentUid,
    userAdventureRef
  } = props;

  const paths = [];
  userAdventureRef.addDataQueries(paths, {
    user: [currentUid]
  });
  console.log(paths);
  return paths;
})
export default class MissionControlPage extends Component {
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
    const {
      children
    } = this.props;

    if (this.IsNotLoadedYet) {
      // still loading
      return (<LoadOverlay />);
    }

    return (
      <div>
        <Panel header="My Current Adventure!">
          <pre>
            { JSON.stringify({
              users: this.props.users,
              adventures: this.props.adventures,
              u2aIdx: this.props.u2aIdx,
              a2uIdx: this.props.a2uIdx
            }, null, 2) }
          </pre>
        </Panel>
      </div>
    );
  }
}
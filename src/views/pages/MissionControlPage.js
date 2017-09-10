import AdventuresRef, { UserAdventureRef } from 'src/core/adventures/AdventuresRef';
import UserInfoRef from 'src/core/users/UserInfoRef';
import MissionsRef from 'src/core/missions/MissionsRef';

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


@firebaseConnect((props, firebase) => {
  const paths = [
    
  ];
  UserAdventureRef.addIndexQueries(paths, {
    user: ['userId4']
  });
  return paths;
})
@connect(({ firebase }, props) => {
  const userAdventureRef = UserAdventureRef(firebase);
  return {
    indexTest: {
      user: userAdventureRef.indexRefs.user.val,
      adventure: userAdventureRef.indexRefs.adventure.val
    }
  };
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
            { JSON.stringify(this.props.indexTest, null, 2) }
          </pre>
        </Panel>
      </div>
    );
  }
}
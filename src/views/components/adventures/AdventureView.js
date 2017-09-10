import { hasLevel } from 'src/core/users/Roles';

import map from 'lodash/map';
import isEmpty from 'lodash/isEmpty';
import size from 'lodash/size';

import React, { Component, PropTypes } from 'react';
import autoBind from 'react-autobind';
import Moment from 'react-moment';
import {
  Alert, Badge,
  Well, Panel
} from 'react-bootstrap';


import AdventureEditTools from './AdventureEditTools';
import UserList, { UserBadge } from 'src/views/components/users/UserList';



export default class AdventureView extends Component {
  static contextTypes = {
    currentUserRef: PropTypes.object,
    lookupLocalized: PropTypes.func.isRequired
  };

  static propTypes = {
    adventureId: PropTypes.string.isRequired,
    adventure: PropTypes.object.isRequired,
    users: PropTypes.object,
    adventureGuardian: PropTypes.object,

    deleteAdventure: PropTypes.func
  };

  constructor() {
    super();

    this.state = {
      editing: null
    };

    autoBind(this);
  }

  get IsAdmin() {
    const { currentUserRef } = this.context;
    return currentUserRef && currentUserRef.isAdminDisplayMode() || false;
  }

  get IsGuardian() {
    const { currentUserRef } = this.context;
    return hasLevel(currentUserRef, 'Guardian');
  }

  get EmptyEl() {
    return (
      <Alert bsStyle="warning" style={{display: 'inline'}} className="no-padding">
        <span>no adventurers have been added yet</span>
      </Alert>
    );
  }

  get IsEditing() {
    return this.state.editing;
  }

  toggleEdit() {
    this.setState({
      editing: !this.IsEditing
    });
  }

  editorHeader() {
    const { 
      adventureId,
      adventure,
      deleteAdventure,
      users,
      mission
    } = this.props;

    const usersString = map(users, user => user && user.displayName).join(', ');
    const missionInfo = mission && `${mission.code} - ${mission.title}` || 'mission';
    const adventureInfo = `${missionInfo} (${usersString})`;

    return !this.IsGuardian ? null : (
      <div>
        <AdventureEditTools {...{
          adventureId,
          entryInfo: adventureInfo,

          //changeOrder: 

          editing: this.IsEditing,
          toggleEdit: this.toggleEdit,

          deleteEntry: deleteAdventure
        }}/>
      </div>
    );
  }

  render() {
    const {
      lookupLocalized
    } = this.context;

    const {
      adventure,
      users,
      mission,
      adventureGuardian,

      adventureEditor
    } = this.props;

    const userEls = isEmpty(users) ? 
      this.EmptyEl : 
      (<UserList users={users} />);

      //console.log(size(users), users);

    const missionHeader = mission && `${mission.code} - ${mission.title}` || 'mission';

    return (<li className="list-group-item">
      <Panel header={missionHeader} bsStyle="info">
        { this.editorHeader() }
        <p>Created: <Moment fromNow>{adventure.createdAt}</Moment></p>
        <p>Guardian: {
          !adventureGuardian ? 
            <span className="color-gray">no guardian</span> :
            <UserBadge user={adventureGuardian} uid={adventure.guardianUid} />
        }</p>
        <div>
          <span>Adventurers ({ size(users) }):</span> { userEls }
        </div>
        <div className="margin-half" />
        { mission && <Well>
            <h4 className="no-margin no-padding">{ mission.description }</h4>

            TODO: render complete mission preview
          </Well>
        }
        { !this.IsEditing ? null : adventureEditor }
      </Panel>
    </li>);
  }
}
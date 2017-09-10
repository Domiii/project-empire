import AdventuresRef, { UserAdventureRef } from 'src/core/adventures/AdventuresRef';
import MissionsRef from 'src/core/missions/MissionsRef';
import { hasLevel } from 'src/core/users/Roles';

import isEmpty from 'lodash/isEmpty';
import map from 'lodash/map';
import sortBy from 'lodash/sortBy';

import { EmptyObject, EmptyArray } from 'src/util';
import { getFirebase } from 'react-redux-firebase';

import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import autoBind from 'react-autobind';
import {
  Button, ListGroup, Alert
} from 'react-bootstrap';

import { Flex, Item } from 'react-flex';

import Select from 'react-select';

import { FAIcon } from 'src/views/components/util';

import AdventureView from './AdventureView';
import AdventureEditor from './AdventureEditor';


@connect(({ firebase }, props) => {
  const userAdventureRef = UserAdventureRef(firebase);
  const userRef = userAdventureRef.refs.user;
  const adventuresRef = userAdventureRef.refs.adventure;
  const missionsRef = MissionsRef(firebase);
  const missions = missionsRef.val || EmptyObject;

  return {
    // userInfoRef: UserInfoRef(firebase),
    adventures: adventuresRef.val,
    missions,
    missionOptions: map(missions, (mission, missionId) => ({
      value: missionId,
      label: `${mission.code} - ${mission.title}`
    })),
    users: userRef.val,
    //userAdventureRef,
    
    addAdventure: adventure => {
      adventure.createdAt = getFirebase().database.ServerValue.TIMESTAMP;
      return adventuresRef.push_adventure(adventure);
    },
    setAdventure: adventuresRef.set_adventure,
    deleteAdventure: adventuresRef.delete_adventure,

    getUsersByAdventure: userAdventureRef.get_user_by_adventure,
    findUnassignedUsers: userAdventureRef.findUnassigned_user_entries,
    addUserToAdventure: userAdventureRef.addEntry,
    deleteUserFromAdventure: userAdventureRef.deleteEntry
  };
})
export default class AdventureList extends Component {
  static contextTypes = {
    currentUserRef: PropTypes.object
  };

  static propTypes = {
    adventures: PropTypes.object,
    missions: PropTypes.object.isRequired,
    users: PropTypes.object,

    addAdventure: PropTypes.func.isRequired,
    setAdventure: PropTypes.func.isRequired,
    deleteAdventure: PropTypes.func.isRequired,

    getUsersByAdventure: PropTypes.func.isRequired,
    findUnassignedUsers: PropTypes.func.isRequired,
    addUserToAdventure: PropTypes.func.isRequired,
    deleteUserFromAdventure: PropTypes.func.isRequired
  };

  constructor() {
    super();

    this.state = {
      adding: false
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

  get IsAdding() {
    return this.state.adding;
  }

  toggleAdding() {
    this.setState({
      adding: !this.IsAdding
    });
  }

  addNewAdventure() {
    const { currentUserRef } = this.context;
    const {
      addAdventure
    } = this.props;

    return addAdventure({
      missionId: this.state.selectedMissionId,
      guardianUid: currentUserRef.props.uid
    });
  }

  onSelectedMissionChanged(option) {
    const {
      missions
    } = this.props;

    let missionId = option && option.value;

    if (!missions[missionId]) {
      missionId = null;
    }
    this.setState({selectedMissionId: missionId})
  }

  makeMissionSelectEl() {
    const {
      missionOptions
    } = this.props;

    return (<Select
      value={this.state.selectedMissionId}
      placeholder="select mission"
      options={missionOptions}
      onChange={this.onSelectedMissionChanged}
    />);
  }

  makeEditorHeader() {
    const { missions } = this.props;

    return !this.IsGuardian ? null : (
      <div>
        <Button active={this.IsAdding}
          bsStyle="success" bsSize="small"
          disabled={isEmpty(missions)}
          onClick={this.toggleAdding}>
          <FAIcon name="plus" className="color-green" /> add new adventure
        </Button>

        { this.IsAdding && <span>
            <Flex row={true} alignItems="start" justifyContent="1" style={{maxWidth: '400px'}}>
              <Item flexGrow="3">
                { this.makeMissionSelectEl() }
              </Item>
              <Item flexGrow="1">
                <Button block
                  bsStyle="success"
                  disabled={!this.state.selectedMissionId}
                  onClick={this.addNewAdventure}>
                  <FAIcon name="save" className="color-green" /> save new adventure
                </Button>
              </Item>
            </Flex>
          </span>
        }
      </div>
    );
  }

  makeAdventureEditorEl(adventureId, adventure, existingUsers, addableUsers) {
    if (!this.IsGuardian) {
      return null;
    }

    const {
        setAdventure,
        addUserToAdventure,
        deleteUserFromAdventure
      } = this.props;

    return (<AdventureEditor {...{
      adventureId,
      adventure,
      existingUsers,
      addableUsers,

      setAdventure: ({adventureId, adventure}) => {
        console.log(adventureId, adventure);
        return setAdventure(adventureId, adventure);
      },
      addUserToAdventure,
      deleteUserFromAdventure
    }} />);
  }

  makeEmptyAdventuresEl() {
    return (
      <Alert bsStyle="warning">
        <span>there are no adventures</span>
      </Alert>
    );
  }

  makeAdventuresList() {
    const { 
      adventures,
      users,
      missions,

      findUnassignedUsers,
      getUsersByAdventure,
      deleteAdventure
    } = this.props;

    const idList = sortBy(Object.keys(adventures), 
      adventureId => -adventures[adventureId].updatedAt);
    const addableUsers = findUnassignedUsers();

    return (<ListGroup> {
      map(idList, (adventureId) => {
        const adventure = adventures[adventureId];
        let existingUsers = getUsersByAdventure(adventureId);
        existingUsers = existingUsers[adventureId] || EmptyObject;

        return (<li key={adventureId} className="list-group-item">
          <AdventureView
          {...{
            canEdit: true,
            adventureId,
            adventure,
            assignedGM: users && users[adventure.assignedGMUid],
            adventureGuardian: users && users[adventure.guardianUid],
            mission: missions && missions[adventure.missionId],

            users: existingUsers,
            //adventuresRef,

            deleteAdventure,

            adventureEditor: this.makeAdventureEditorEl(
              adventureId, adventure,
              existingUsers, addableUsers)
          }} />
        </li>);
      })
    } </ListGroup>);
  }

  render() {
    const { 
      adventures,

      //userInfoRef,
      //adventuresRef,

      setAdventure,
      deleteAdventure,

      getUsersByAdventure,

      addUserToAdventure,
      deleteUserFromAdventure
    } = this.props;


    let adventureListEl;
    if (isEmpty(adventures)) {
      adventureListEl = this.makeEmptyAdventuresEl();
    }
    else {
      adventureListEl = this.makeAdventuresList();
    }

    return (<div>
      { this.makeEditorHeader() }
      { adventureListEl }
    </div>);
  }
}
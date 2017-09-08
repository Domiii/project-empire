import isEmpty from 'lodash/isEmpty';
import map from 'lodash/map';
import sortBy from 'lodash/sortBy';

import GroupsRef, { UserGroupRef } from 'src/core/groups/GroupsRef';

import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import autoBind from 'react-autobind';
import {
  Button, ListGroup, ListGroupItem, Alert
} from 'react-bootstrap';
import { EmptyObject, EmptyArray } from 'src/util';

import { FAIcon } from 'src/views/components/util';

import GroupView from './GroupView';
import GroupEditor from './GroupEditor';


@connect(({ firebase }, props) => {
  const userGroupRef = UserGroupRef(firebase);
  const userRef = userGroupRef.refs.user;
  const groupsRef = userGroupRef.refs.group;

  return {
    // userInfoRef: UserInfoRef(firebase),
    // groupsRef,
    //userRef,
    groupsRef: groupsRef && groupsRef.val,
    //userGroupRef,
    
    addGroup: groupsRef.push_group,
    setGroup: groupsRef.set_group,
    deleteGroup: groupsRef.delete_group,

    getUsersByGroup: userGroupRef.get_user_by_group,
    findUnassignedUsers: userGroupRef.findUnassigned_user_entries,
    addUserToGroup: userGroupRef.addEntry,
    deleteUserFromGroup: userGroupRef.deleteEntry
  };
})
export default class GroupList extends Component {
  static contextTypes = {
    currentUserRef: PropTypes.object
  };

  static propTypes = {
    groups: PropTypes.object,
    //users: PropTypes.object.isRequired,

    addGroup: PropTypes.func.isRequired,
    setGroup: PropTypes.func.isRequired,
    deleteGroup: PropTypes.func.isRequired,

    getUsersByGroup: PropTypes.func.isRequired,
    findUnassignedUsers: PropTypes.func.isRequired,
    addUserToGroup: PropTypes.func.isRequired,
    deleteUserFromGroup: PropTypes.func.isRequired
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

  get IsAdding() {
    return this.state.adding;
  }

  toggleAdding() {
    this.setState({
      adding: !this.IsAdding
    });
  }

  addNewGroup() {
    const {
      addGroup
    } = this.props;

    return addGroup({});
  }

  makeEditorHeader() {
    return !this.IsAdmin ? null : (
      <div>
        <Button active={this.IsAdding}
          bsStyle="success" bsSize="small"
          onClick={this.addNewGroup}>
          <FAIcon name="plus" className="color-green" /> add new group
        </Button>
      </div>
    );
  }

  makeGroupEditorEl(groupId, group, existingUsers, addableUsers) {
    if (!this.IsAdmin) {
      return null;
    }

    const {
        setGroup,
        addUserToGroup,
        deleteUserFromGroup
      } = this.props;

    return (<GroupEditor {...{
      groupId,
      group,
      existingUsers,
      addableUsers,

      setGroup: ({groupId, group}) => {
        console.log(groupId, group);
        return setGroup(groupId, group);
      },
      addUserToGroup,
      deleteUserFromGroup
    }} />);
  }

  makeEmptyGroupsEl() {
    return (
      <Alert bsStyle="warning">
        <span>there are no groups</span>
      </Alert>
    );
  }

  makeGroupsList() {
    const { 
      groups,
      findUnassignedUsers,
      getUsersByGroup,

      addUserToGroup,
      deleteGroup,
      
      deleteUserFromGroup
    } = this.props;

    const idList = sortBy(Object.keys(groups), 
      groupId => -groups[groupId].updatedAt);
    const addableUsers = findUnassignedUsers();

    return (<ListGroup> {
      map(idList, (groupId) => {
        const group = groups[groupId];
        let existingUsers = getUsersByGroup(groupId);
        existingUsers = existingUsers[groupId] || EmptyObject;

        return (<GroupView key={groupId} 
          {...{
            groupId,
            group,

            users: existingUsers,
            //groupsRef,

            addUserToGroup,
            deleteGroup,

            deleteUserFromGroup,

            groupEditor: this.makeGroupEditorEl(
              groupId, group,
              existingUsers, addableUsers)
          }} />);
      })
    } </ListGroup>);
  }

  render() {
    const { 
      groups,

      //userInfoRef,
      //groupsRef,

      setGroup,
      deleteGroup,

      getUsersByGroup,

      addUserToGroup,
      deleteUserFromGroup
    } = this.props;


    let groupListEl;
    if (isEmpty(groups)) {
      groupListEl = this.makeEmptyGroupsEl();
    }
    else {
      groupListEl = this.makeGroupsList();
    }

    return (<div>
      { this.makeEditorHeader() }
      { groupListEl }
    </div>);
  }
}
import isEmpty from 'lodash/isEmpty';
import map from 'lodash/map';
import mapValues from 'lodash/mapValues';
import sortBy from 'lodash/sortBy';
import groupBy from 'lodash/groupBy';
import zipObject from 'lodash/zipObject';

import { EmptyObject, EmptyArray } from 'src/util';

import UserInfoRef from 'src/core/users/UserInfoRef';
import Roles from 'src/core/users/Roles';

import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { firebaseConnect } from 'react-redux-firebase'

import autoBind from 'react-autobind';
import {
  Panel, Button, ListGroup, ListGroupItem, Alert, Badge
} from 'react-bootstrap';

import ConfirmModal from 'src/views/components/util/ConfirmModal';
import { FAIcon } from 'src/views/components/util';

import UserList from 'src/views/components/users/UserList';


const userListNames = [
  'Adventurer',
  'Guardian',
  'GM'
];

// create + cache "changeRoleButtons" components
function makeChangeRoleButtons(setRoleName) {
  return zipObject(userListNames, 
    map(userListNames, roleName => {
      const header = `Make user ${roleName}?`;
      const changeRole = uid => setRoleName(uid, roleName);

      return ({user, uid}) => {
        const arrowEl = Roles[roleName] < user.role ? 
          (<span className="color-red"><FAIcon name="level-down" /></span>) :
          (<span className="color-green"><FAIcon name="level-up" /></span>);
        const btnEl = ({open}) => (<Button onClick={open} bsSize="small"
              className="no-padding">
            { roleName } { arrowEl }
          </Button>);
        return (<ConfirmModal
          key={roleName}
          header={header}
          body={(<span>
            { user.displayName }
            { arrowEl }
          </span>)}
          ButtonCreator={btnEl}
          onConfirm={changeRole}
          confirmArgs={uid}
        />);
      };
    }
  ));
}

@firebaseConnect((props, firebase) => {
  const paths = [
    UserInfoRef.userList.makeQuery()
  ];
  return paths;
})
@connect(({ firebase }, props) => {
  const userListRef = UserInfoRef.userList(firebase);
  return {
    userListRef,
    setRoleName: userListRef.setRoleName,
    changeRoleButtons: makeChangeRoleButtons(userListRef.setRoleName)
  };
})
export default class RoleManager extends Component {
  static contextTypes = {
    currentUserRef: PropTypes.object
  };

  static propTypes = {
    userListRef: PropTypes.object.isRequired,
    setRoleName: PropTypes.func.isRequired
  };

  constructor() {
    super();

    autoBind(this);
  }

  get IsAdmin() {
    const { currentUserRef } = this.context;
    return currentUserRef && currentUserRef.isAdminDisplayMode() || false;
  }

  RenderUser({user, uid}) {
    const otherRoles = userListNames.filter(name => Roles[name] !== (user.role || 1));
    const ButtonComps = map(otherRoles, role => this.props.changeRoleButtons[role]);
    const buttonEls = (
      <span>
        {map(ButtonComps, (Btn, i) => (
          <Btn key={otherRoles[i]} user={user} uid={uid} />
        ))}
      </span>
    );

    return (<Badge>
      <span className="user-tag">
        <img src={user.photoURL} className="user-image-tiny" /> &nbsp;
        {user.displayName} &nbsp;
        {buttonEls}
      </span>
    </Badge>);
  }

  getUserLists() {
    const { 
      userListRef,
    } = this.props;

    const allUsers = userListRef.val || {};
    const allUids = Object.keys(allUsers);
    const sortedUids = sortBy(allUids, uid => allUsers[uid].role || 1);
    const userLists = map(userListNames, name => ({ name, role: Roles[name], list: {} }));

    // sort users into userLists by role
    let listI = 0;
    for (let i = 0; i < sortedUids.length; ++i) {
      const uid = sortedUids[i];
      const user = allUsers[uid];
      while (listI < userListNames.length-1 && user.role && user.role >= userLists[listI+1].role) {
        ++listI;
      }
      userLists[listI].list[uid] = user;
    }
    return userLists;
  }

  roleListEls() {
    const { 
      userListRef,
      setRoleName
    } = this.props;

    const userLists = this.getUserLists();

    // render
    return (
      map(userLists, (userList) => {
        const {
          name,
          list
        } = userList;

        return (<Panel key={name} header={name}> 
          <UserList users={list} 
              renderUser={this.RenderUser} />
        </Panel>);
      })
    );
  }

  render() {
    if (!this.IsAdmin) {
      return (
        <Alert bsStyle="warning">GM only</Alert>
      );
    }

    return (<div>
      { this.roleListEls() }
    </div>);
  }
}
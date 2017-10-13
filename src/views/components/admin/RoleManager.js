import isEmpty from 'lodash/isEmpty';
import map from 'lodash/map';
import mapValues from 'lodash/mapValues';
import sortBy from 'lodash/sortBy';
import groupBy from 'lodash/groupBy';
import zipObject from 'lodash/zipObject';

import { EmptyObject, EmptyArray } from 'src/util';

import UserInfoRef from 'src/core/users/UserInfoRef';
import Roles, { isAtLeastRole } from 'src/core/users/Roles';

import React, { Component } from 'react';
import PropTypes from 'prop-types';

import autoBind from 'react-autobind';

import dataBind from 'src/dbdi/react/dataBind';

import {
  Panel, Button, ListGroup, ListGroupItem, Alert, Badge
} from 'react-bootstrap';

import ConfirmModal from 'src/views/components/util/ConfirmModal';
import { FAIcon } from 'src/views/components/util';

import UserList from 'src/views/components/users/UserList';
import UserIcon from 'src/views/components/users/UserIcon';


const RoleNames = [
  'Adventurer',
  'Guardian',
  'GM'
];

// create + cache "changeRoleButtons" components
function RoleChangeArrow({ role1, role2 }) {
  return isAtLeastRole(role1, role2) ?
    (<span className="color-green"><FAIcon name="level-up" /></span>) :
    (<span className="color-red"><FAIcon name="level-down" /></span>);
}

function ChangeRoleButton({ oldRoleName, newRole, open }) {
  return (<Button onClick={open} bsSize="small" className="no-padding">
    <RoleChangeArrow role1={oldRoleName} role2={newRole} /> {oldRoleName}
  </Button>);
}

function makeChangeRoleButtons({}, { setRoleName }) {
  return zipObject(
    RoleNames,
    map(RoleNames, newRoleName => {
      const changeRole = uid => setRoleName({ uid, role: newRoleName });

      return ({ user, uid }) => (<ConfirmModal
        key={newRoleName}
        header={<span>Make user <RoleChangeArrow
          role1={newRoleName} role2={user.role} /> {newRoleName}?</span>}
        ButtonCreator={ChangeRoleButton}
        onConfirm={changeRole}
        confirmArgs={uid}

        oldRoleName={user.role}
        newRole={newRoleName}
      >
        <span>
          Promote/demote {user.displayName} to <RoleChangeArrow
            role1={newRoleName} role2={user.role} /> {newRoleName}?
          </span>
      </ConfirmModal>);
    })
  );
}

@dataBind({
  makeChangeRoleButtons,
  
  userLists({}, {}, { usersPublic }) {
    const allUids = Object.keys(usersPublic);
    const sortedUids = sortBy(allUids, uid => usersPublic[uid].role || 1);
    const userLists = map(RoleNames, name => ({ name, role: Roles[name], list: {} }));

    // sort users into userLists by role
    let listI = 0;
    for (let i = 0; i < sortedUids.length; ++i) {
      const uid = sortedUids[i];
      const user = usersPublic[uid];
      while (listI < RoleNames.length - 1 && user.role && user.role >= userLists[listI + 1].role) {
        ++listI;
      }
      userLists[listI].list[uid] = user;
    }
    return userLists;
  }
})
export default class RoleManager extends Component {
  constructor(props) {
    super();

    this.changeRoleButtons = props.makeChangeRoleButtons();

    this.dataBindMethods(
      this.getUserList
    );
    
    autoBind(this);
  }

  RenderUser({ user, uid }) {
    const otherRoles = RoleNames.filter(name => Roles[name] !== (user.role || 0));
    const ButtonComps = map(otherRoles, role => this.changeRoleButtons[role]);
    const buttonEls = (
      <span>
        {map(ButtonComps, (Btn, i) => (
          <Btn key={otherRoles[i]} user={user} uid={uid} />
        ))}
      </span>
    );

    return (<Badge>
      <span className="user-tag">
        <UserIcon user={user} size="tiny" /> &nbsp;
        {user.displayName} &nbsp;
        {buttonEls}
      </span>
    </Badge>);
  }

  render({}, {}, { isCurrentUserAdminDisplayRole, userLists }) {
    if (!isCurrentUserAdminDisplayRole) {
      return (
        <Alert bsStyle="warning">GM only</Alert>
      );
    }

    return (<div>
      {
        map(userLists, (userList) => {
          const {
            name,
            list
          } = userList;

          return (<Panel key={name} header={name}>
            <UserList users={list} renderUser={this.RenderUser} />
          </Panel>);
        })
      }
    </div>);
  }
}
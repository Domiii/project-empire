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

function RoleChangeLabel({ newRoleName, oldRole }) {
  return (<span>
    {isAtLeastRole(newRoleName, oldRole) ?
      (<span className="color-green"><FAIcon name="level-up" /></span>) :
      (<span className="color-red"><FAIcon name="level-down" /></span>)
    }
    {newRoleName}
  </span>);
}

function ChangeRoleButton({ oldRole, newRoleName, open }) {
  return (<Button onClick={open} bsSize="small" className="no-padding">
    <RoleChangeLabel oldRole={oldRole} newRole={newRoleName} />
  </Button>);
}

const RoleEditor = dataBind({
  changeRole({ uid, newRoleName }, { setRoleName }) {
    return setRoleName({ uid, role: newRoleName });
  }
})(({ uid, newRoleName }, { changeRole, userPublic }, { }) => {
  const user = userPublic({ uid });

  return (<ConfirmModal
    key={newRoleName}
    header={<span>Make user <RoleChangeLabel role1={newRoleName} role2={user.role} />?</span>}
    ButtonCreator={ChangeRoleButton}
    onConfirm={changeRole}

    oldRole={user.role}
    newRoleName={newRoleName}
  >
    <span>
      Promote/demote {user.displayName} t
      o <RoleChangeLabel newRole={newRoleName} oldRole={user.role} />?
    </span>
  </ConfirmModal>);
});


@dataBind({
  userLists({ }, { }, { usersPublic }) {
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

    this.dataBindMethods(
      this.getUserList
    );

    autoBind(this);
  }

  RenderUser({ user, uid }) {
    const otherRoles = RoleNames.filter(name => Roles[name] !== (user.role || 0));
    const buttonEls = (
      <span>
        {map(otherRoles, (newRoleName) => (
          <RoleEditor key={newRoleName} uid={uid} newRoleName={newRoleName} />
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

  render({ }, { }, { isCurrentUserAdmin, userLists }) {
    if (!isCurrentUserAdmin) {
      return (
        <Alert bsStyle="warning">GM only</Alert>
      );
    }

    return (<div>{
      map(userLists, (userList) => {
        const {
            name,
          list
          } = userList;

        return (<Panel key={name} header={name}>
          <UserList uids={Object.keys(list)} renderUser={this.RenderUser} />
        </Panel>);
      })
    }</div>);
  }
}
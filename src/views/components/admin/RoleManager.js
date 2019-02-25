import isEmpty from 'lodash/isEmpty';
import map from 'lodash/map';
import mapValues from 'lodash/mapValues';
import sortBy from 'lodash/sortBy';
import groupBy from 'lodash/groupBy';
import zipObject from 'lodash/zipObject';

import { EmptyObject, EmptyArray } from 'src/util';

import Roles, { hasRole } from 'src/core/users/Roles';

import React, { Component } from 'react';
import PropTypes from 'prop-types';

import autoBind from 'react-autobind';

import { dataBind } from 'dbdi/react';

import {
  Panel, Button, ListGroup, ListGroupItem, Alert, Badge
} from 'react-bootstrap';

import ConfirmModal from 'src/views/components/util/ConfirmModal';
import FAIcon from 'src/views/components/util/FAIcon';
import LoadIndicator from 'src/views/components/util/LoadIndicator';

import UserList from 'src/views/components/users/UserList';
import UserIcon from 'src/views/components/users/UserIcon';

import FancyPanelToggleTitle from 'src/views/components/util/FancyPanelToggleTitle';


const RoleNames = [
  'Unregistered',
  'User',
  'Guardian',
  'GM'
];

function RoleChangeLabel({ newRole, oldRole }) {
  return (<span>
    {hasRole(newRole, oldRole) ?
      (<span className="color-green"><FAIcon name="level-up" /></span>) :
      (<span className="color-red"><FAIcon name="level-down" /></span>)
    }
    {newRole}
  </span>);
}
// RoleChangeLabel.propTypes = {
//   newRole: PropTypes.oneOfType([
//     PropTypes.number,
//     PropTypes.string
//   ]).isRequired,
//   oldRole: PropTypes.oneOfType([
//     PropTypes.number,
//     PropTypes.string
//   ]).isRequired
// };

function ChangeRoleButton({ oldRole, newRole, open }) {
  console.log('oldRole', oldRole);
  return (<Button onClick={open} bsSize="small" className="no-padding">
    <RoleChangeLabel oldRole={oldRole} newRole={newRole} />
  </Button>);
}
ChangeRoleButton.propTypes = {
  oldRole: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.string
  ]).isRequired,
  newRole: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.string
  ]).isRequired,
  open: PropTypes.func.isRequired
};

const RoleEditor = dataBind({
  changeRole({ uid, newRole }, { setRole }) {
    return setRole({ uid, role: newRole });
  }
})(({ uid, newRole }, { changeRole, userPublic }, { }) => {
  const user = userPublic({ uid });

  return (<ConfirmModal
    key={newRole}
    header={<span>Make user <RoleChangeLabel newRole={newRole} oldRole={user.role || 0} />?</span>}
    ButtonCreator={ChangeRoleButton}
    onConfirm={changeRole}

    oldRole={user.role || 0}
    newRole={newRole}
  >
    <span>
      Promote/demote {user.displayName} to <RoleChangeLabel newRole={newRole} oldRole={user.role || 0} />?
    </span>
  </ConfirmModal>);
});


const RenderUser = dataBind({})(
  ({ uid }, { userPublic }) => {
    const user = userPublic({ uid });
    const otherRoles = RoleNames.filter(name => Roles[name] !== (user.role || 0));
    const buttonEls = (
      <span>
        {map(otherRoles, (newRole) => (
          <RoleEditor key={newRole} uid={uid} newRole={newRole} />
        ))}
      </span>
    );

    return (<Badge>
      <span className="user-tag">
        <UserIcon uid={uid} size="tiny" /> &nbsp;
        {user.displayName} &nbsp;
        {buttonEls}
      </span>
    </Badge>);
  }
);

@dataBind({})
export class RoleLists extends Component {
  render(
    { },
    { roleUserLists }
  ) {
    return (<div>{
      map(roleUserLists({roleNames: RoleNames}), (userList) => {
        const {
          name,
          list
        } = userList;

        return (<Panel key={name}>
          <Panel.Heading>{name}</Panel.Heading>
          <Panel.Body>
            <UserList uids={Object.keys(list)} renderUser={RenderUser} />
          </Panel.Body>
        </Panel>);
      })
    }</div>);
  }
}

@dataBind({})
export default class RoleManager extends Component {
  state = {
    expanded: false
  };

  toggleExpand = () => {
    const { expanded } = this.state;
    this.setState({ expanded: !expanded });
  }

  onSelect = (fileId) => {
    this.setState({ selectedId: fileId });
  }

  render(
    { },
    { },
    { isCurrentUserAdmin, usersPublic_isLoaded }
  ) {
    if (!usersPublic_isLoaded) {
      return <LoadIndicator />;
    }
    if (!isCurrentUserAdmin) {
      return (
        <Alert bsStyle="warning">GM only</Alert>
      );
    }


    const { expanded } = this.state;

    return (<Panel expanded={expanded} onToggle={this.toggleExpand}>
      <Panel.Heading>
        <FancyPanelToggleTitle>
          Role Manager
        </FancyPanelToggleTitle>
      </Panel.Heading>
      <Panel.Body collapsible>
        <div>{expanded &&
          <RoleLists />
          || <div className="margin10" />
        }</div>
      </Panel.Body>
    </Panel>);
  }
}
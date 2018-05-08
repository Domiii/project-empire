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

import dataBind from 'src/dbdi/react/dataBind';

import {
  Panel, Button, ListGroup, ListGroupItem, Alert, Badge
} from 'react-bootstrap';

import ConfirmModal from 'src/views/components/util/ConfirmModal';
import { FAIcon } from 'src/views/components/util';
import LoadIndicator from 'src/views/components/util/LoadIndicator';

import UserList from 'src/views/components/users/UserList';
import UserIcon from 'src/views/components/users/UserIcon';

import FancyPanelToggleTitle from 'src/views/components/util/FancyPanelToggleTitle';

@dataBind({
  
})
export class UserTable extends Component {
  render(
    { },
    { }
  ) {
    return (<div>{
      map([], (userList) => {
        const {
          name,
          list
        } = userList;

        return (<Panel key={name}>
          <Panel.Heading>{name}</Panel.Heading>
          <Panel.Body>
            hi!
          </Panel.Body>
        </Panel>);
      })
    }</div>);
  }
}


@dataBind({})
export default class UserManager extends Component {
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
          Users
        </FancyPanelToggleTitle>
      </Panel.Heading>
      <Panel.Body collapsible>
        <div>{expanded &&
          <UserTable />
          || <div className="margin10" />
        }</div>
      </Panel.Body>
    </Panel>);
  }
}
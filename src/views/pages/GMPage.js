import GroupsRef, { UserGroupRef } from 'src/core/groups/GroupsRef';
import UserInfoRef from 'src/core/users/UserInfoRef';

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  Alert, Button, Jumbotron, Well, Panel
} from 'react-bootstrap';

import autoBind from 'react-autobind';
import {
  LinkContainer
} from 'react-router-bootstrap';
import { LoadOverlay } from 'src/views/components/overlays';

import RoleManager from 'src/views/components/admin/RoleManager';


export default class GMPage extends Component {
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

  get IsAdmin() {
    return this.context.currentUserRef.isAdminDisplayMode();
  }

  render() {
    if (this.IsNotLoadedYet) {
      // still loading
      return (<LoadOverlay />);
    }

    if (!this.IsAdmin) {
      return (<Alert bsStyle="warning">GMs only :/</Alert>);
    }

    return (
      <div>
        <Panel bsStyle="primary" header="Roles">
          <RoleManager />
        </Panel>
        <Panel bsStyle="primary" header="上課">
          <ul>
            <li>預備</li>
            <li>過程 + 紀錄</li>
          </ul>
        </Panel>
        <Panel bsStyle="primary" header="鑑定">
          <ul>
            <li>預備</li>
            <li>過程 + 紀錄</li>
            <li>fame 紀錄</li>
          </ul>
        </Panel>
        <Panel bsStyle="primary" header="資源">
          <ul>
            <li>Fame</li>
            <li>Karma</li>
            <li>Gold</li>
          </ul>
        </Panel>
      </div>
    );
  }
}
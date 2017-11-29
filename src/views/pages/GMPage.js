import React, { Component } from 'react';
import PropTypes from 'prop-types';
import dataBind from 'src/dbdi/react/dataBind';

import {
  Alert, Button, Jumbotron, Well, Panel
} from 'react-bootstrap';

import {
  LinkContainer
} from 'react-router-bootstrap';
import { LoadOverlay } from 'src/views/components/overlays';

import RoleManager from 'src/views/components/admin/RoleManager';

@dataBind({

})
export default class GMPage extends Component {
  constructor(...args) {
    super(...args);
  }

  render({ }, { }, { isCurrentUserAdmin, currentUser_isLoaded }) {
    if (!currentUser_isLoaded) {
      return (<LoadOverlay />);
    }
    if (!isCurrentUserAdmin) {
      return (<Alert bsStyle="warning">GMs only :/</Alert>);
    }

    return (
      <div>
        <Panel bsStyle="primary" header="Roles">
          <RoleManager />
        </Panel>
        {/* <Panel bsStyle="primary" header="上課">
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
        </Panel> */}
      </div>
    );
  }
}
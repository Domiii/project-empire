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
        <Panel bsStyle="primary">
          <Panel.Heading>
            Roles
          </Panel.Heading>
          <Panel.Body>
            <RoleManager />
          </Panel.Body>
        </Panel>

        <Well>
          TODO:
          <pre>{`* 學習菜單: https://pecu.gitbooks.io/-r/content/
          `}
          </pre>
        </Well>
      </div>
    );
  }
}
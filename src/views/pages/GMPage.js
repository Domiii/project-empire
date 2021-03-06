import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { dataBind } from 'dbdi/react';

import {
  Alert, Button, Jumbotron, Well, Panel
} from 'react-bootstrap';

import {
  LinkContainer
} from 'react-router-bootstrap';
import { LoadOverlay } from 'src/views/components/overlays';

import CohortManager from 'src/views/components/admin/CohortManager';
import UserManager from 'src/views/components/admin/UserManager';
import RoleManager from 'src/views/components/admin/RoleManager';

@dataBind({

})
export default class GMPage extends Component {
  constructor(...args) {
    super(...args);
  }

  render({ }, { }, 
    { isCurrentUserAdmin, currentUser_isLoaded, currentUserCohortId }
  ) {
    if (!currentUser_isLoaded) {
      return (<LoadOverlay />);
    }
    if (!isCurrentUserAdmin) {
      return (<Alert bsStyle="warning">GMs only :/</Alert>);
    }

    return (
      <div className="container">
        <Well>
          Cohort: {currentUserCohortId}
        </Well>
        <CohortManager />
        <UserManager />
        <RoleManager />
      </div>
    );
  }
}
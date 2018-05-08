import React, { Component } from 'react';
import PropTypes from 'prop-types';
import dataBind from 'src/dbdi/react/dataBind';

import {
  Alert, Button, Jumbotron, Well, Panel
} from 'react-bootstrap';

import { LoadOverlay } from 'src/views/components/overlays';

import UserBadge from 'src/views/components/users/UserBadge';
import LearnerStatusEntryForm from 'src/views/components/scaffolding/LearnerStatusEntryForm';

@dataBind()
export default class LearnerStatusListPage extends Component {
  static propTypes = {
  };

  constructor(...args) {
    super(...args);
  }

  render(
    { match },
    { },
    { isCurrentUserAdmin, currentUser_isLoaded }
  ) {
    if (!currentUser_isLoaded) {
      return (<LoadOverlay />);
    }
    if (!isCurrentUserAdmin) {
      return (<Alert bsStyle="warning">GMs only :/</Alert>);
    }

    const { uid } = match.params;
    const header = (<span><UserBadge uid={uid} /> learner status</span>);

    return (
      <div>
        <Panel bsStyle="primary" header={header}>
          TODO: user status
        </Panel>
      </div>
    );
  }
}
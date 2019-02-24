import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { dataBind } from 'dbdi/react';

import {
  Alert, Button, Jumbotron, Well, Panel
} from 'react-bootstrap';

import { LoadOverlay } from 'src/views/components/overlays';

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

    const { mode, uid, scheduleId, cycleId } = match.params;

    const formProps = { mode, uid, scheduleId, cycleId };
    return (
      <div>
        <LearnerStatusEntryForm {...formProps} />
      </div>
    );
  }
}
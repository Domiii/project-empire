import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { dataBind } from 'dbdi/react';

import {
  Alert, Button, Jumbotron, Well, Panel
} from 'react-bootstrap';

import { LoadOverlay } from 'src/views/components/overlays';

import CohortList from 'src/views/components/cohorts/CohortList';


@dataBind()
export default class CohortPage extends Component {
  static propTypes = {

  };

  constructor(...args) {
    super(...args);
  }

  render(
    { },
    { },
    { currentUser_isLoaded }
  ) {
    if (!currentUser_isLoaded) {
      return (<LoadOverlay />);
    }

    return (
      <div className="container">
        <Panel bsStyle="primary">
          <Panel.Heading>
            Cohorts
          </Panel.Heading>
          <Panel.Body>
            <CohortList />
          </Panel.Body>
        </Panel>
      </div>
    );
  }
}
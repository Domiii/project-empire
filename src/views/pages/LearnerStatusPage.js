import React, { Component } from 'react';
import PropTypes from 'prop-types';
import dataBind from 'src/dbdi/react/dataBind';

import { 
  Alert, Button, Jumbotron, Well, Panel
} from 'react-bootstrap';

import { LoadOverlay } from 'src/views/components/overlays';

import LearnerStatusList from 'src/views/components/projects/LearnerStatusList';


export default class LearnerStatusPage extends Component {
  static propTypes = {
    
  };

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
        <Panel bsStyle="primary" header="Learners">
          <LearnerStatusList />
        </Panel>
      </div>
    );
  }
}
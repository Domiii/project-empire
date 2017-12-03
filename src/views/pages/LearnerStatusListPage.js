import React, { Component } from 'react';
import PropTypes from 'prop-types';
import dataBind from 'src/dbdi/react/dataBind';

import { 
  Alert, Button, Jumbotron, Well, Panel
} from 'react-bootstrap';

import { LoadOverlay } from 'src/views/components/overlays';

import LearnerStatusList from 'src/views/components/scaffolding/LearnerStatusList';

@dataBind()
export default class LearnerStatusListPage extends Component {
  static propTypes = {
    
  };

  constructor(...args) {
    super(...args);
  }

  render(
    { }, 
    { }, 
    { isCurrentUserAdmin, currentUser_isLoaded,
      currentLearnerScheduleId, currentLearnerScheduleCycleId, currentLearnerScheduleId_isLoaded }
  ) {
    if (!currentUser_isLoaded | !currentLearnerScheduleId_isLoaded) {
      return (<LoadOverlay />);
    }
    if (!isCurrentUserAdmin) {
      return (<Alert bsStyle="warning">GMs only :/</Alert>);
    }

    return (
      <div>
        <Panel bsStyle="primary" header="Learners">
          <LearnerStatusList
            scheduleId={currentLearnerScheduleId} 
            cycleId={currentLearnerScheduleCycleId} />
        </Panel>
      </div>
    );
  }
}
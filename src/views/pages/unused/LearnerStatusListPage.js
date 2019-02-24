import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { dataBind } from 'dbdi/react';

import { 
  Alert, Button, Jumbotron, Well, Panel
} from 'react-bootstrap';

import { LoadOverlay } from 'src/views/components/overlays';

import LearnerStatusList from 'src/views/components/scaffolding/LearnerStatusList';

import UserCycleStatusList from 'src/views/components/scaffolding/UserCycleStatusList';

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
      currentLearnerScheduleId, currentLearnerScheduleCycleId, 
      currentLearnerScheduleId_isLoaded }
  ) {
    if (!currentUser_isLoaded | !currentLearnerScheduleId_isLoaded | !currentLearnerScheduleCycleId) {
      return (<LoadOverlay />);
    }
    if (!isCurrentUserAdmin) {
      return (<Alert bsStyle="warning">GMs only :/</Alert>);
    }


    // let lateReflections;

    // {lateReflections && (
    //   <Panel bsStyle="danger">
    //     <Panel.Heading>
    //       緊急的事
    //     </Panel.Heading>
    //     <Panel.Body>
    //       TODO: 已經過的 cycle，而且還沒填好的反思調查清淡～
    //       <div>
    //           TODO: 請更新你之前還沒更新的分享狀態
    //       </div>
    //     </Panel.Body>
    //   </Panel>
    // ) || ''}

    // <UserCycleStatusList />

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
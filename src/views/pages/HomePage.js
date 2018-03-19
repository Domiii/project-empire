import React, { Component } from 'react';
import PropTypes from 'prop-types';
import dataBind from 'src/dbdi/react/dataBind';

import {
  Alert, Button, Jumbotron, Well,
  Panel
} from 'react-bootstrap';

import GoalForm from 'src/views/components/goals/GoalForm';
import {
  CycleStatusListOfUser
} from 'src/views/components/scaffolding/CycleStatusList';

//import LearnerStatusList from 'src/views/components/scaffolding/LearnerStatusList';

import FancyPanelToggleTitle from 'src/views/components/util/FancyPanelToggleTitle';

import { LoadOverlay } from 'src/views/components/overlays';



@dataBind()
export default class HomePage extends Component {
  static propTypes = {

  };

  constructor(...args) {
    super(...args);
  }

  render(
    { },
    { },
    { currentUid, currentUid_isLoaded,
      currentLearnerScheduleId, currentLearnerScheduleId_isLoaded,
      currentScheduleCycleName, currentScheduleCycleName_isLoaded,
      currentLearnerScheduleCycleId, currentLearnerScheduleCycleId_isLoaded
    }
  ) {
    if (!currentUid_isLoaded | 
      !currentScheduleCycleName_isLoaded |
      !currentLearnerScheduleCycleId_isLoaded) {
      return (<LoadOverlay />);
    }

    let lateReflections;
    const scheduleId = currentLearnerScheduleId;
    const cycleId = currentLearnerScheduleCycleId;
    const uid = currentUid;
    const goalFormArgs1 = {
      scheduleId, cycleId, uid
    };
    const goalFormArgs2 = cycleId > 1 && {
      scheduleId, cycleId: cycleId-1, uid
    };

    return (
      <div>
        {/* <Panel bsStyle="primary">
          <Panel.Heading>
            我們的學習環境
          </Panel.Heading>
          <Panel.Body>
            <Well className="no-margin">
            TODO: 這 {currentScheduleCycleName} 的學生主持人： ...
            </Well>
          </Panel.Body>
        </Panel> */}

        {lateReflections && (
          <Panel bsStyle="danger">
            <Panel.Heading>
              緊急的事
            </Panel.Heading>
            <Panel.Body>
              TODO: 已經過的 cycle，而且還沒填好的反思調查清淡～
              <div>
                  TODO: 請更新你之前還沒更新的分享狀態
              </div>
            </Panel.Body>
          </Panel>
        ) || ''}

        <CycleStatusListOfUser />

        {/* <div>
          TODO: 本 cycle 學習反思調查～
          TODO: 本週的分享狀態
        </div> */}
      </div>
    );
  }
}
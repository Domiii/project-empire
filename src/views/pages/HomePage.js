import React, { Component } from 'react';
import PropTypes from 'prop-types';
import dataBind from 'src/dbdi/react/dataBind';

import { 
  Alert, Button, Jumbotron, Well,
  Panel
} from 'react-bootstrap';

import GoalForm from 'src/views/components/goals/GoalForm';
import GoalHistory from 'src/views/components/goals/GoalHistory';

import LearnerStatusList from 'src/views/components/scaffolding/LearnerStatusList';

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
    { currentUser_isLoaded,
      currentLearnerScheduleCycleId_isLoaded }
  ) {
    if (!currentUser_isLoaded | 
      !currentLearnerScheduleCycleId_isLoaded) {
      return (<LoadOverlay />);
    }

    let lateReflections;

    return (
      <div>
        <Panel bsStyle="primary">
          <Panel.Heading>
            我們的學習環境
          </Panel.Heading>
          <Panel.Body>
            <Well className="no-margin">
            TODO: 這週的學生主持人： ...
            </Well>
          </Panel.Body>
        </Panel>

        { lateReflections && (
        <Panel bsStyle="danger">
          <Panel.Heading>
            緊急的事
          </Panel.Heading>
          <Panel.Body>
            TODO: 已經過的 cycle，而且還沒填好的反思調查清淡～
          </Panel.Body>
        </Panel>
        ) || '' }
        
        <Panel bsStyle="primary">
          <Panel.Heading>
            我目前的目標 ❤️
          </Panel.Heading>
          <Panel.Body>
            <Well>
              <GoalForm />
              <GoalHistory />
            </Well>
            <Button block>
              TODO: Toggle (本 cycle) 學習反思調查～
            </Button>
          </Panel.Body>
        </Panel>
        
        <Panel bsStyle="primary">
          <Panel.Heading>
            <FancyPanelToggleTitle>
              歷史紀錄
            </FancyPanelToggleTitle>
          </Panel.Heading>
          <Panel.Body collapsible>
            TODO
          </Panel.Body>
        </Panel>
      </div>
    );
  }
}
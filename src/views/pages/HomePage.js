import React, { Component } from 'react';
import PropTypes from 'prop-types';
import dataBind from 'src/dbdi/react/dataBind';

import {
  Alert, Button, Jumbotron, Well,
  Panel
} from 'react-bootstrap';


import UserCycleStatusList from 'src/views/components/scaffolding/UserCycleStatusList';

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
    { }
  ) {
    let lateReflections;

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

        <UserCycleStatusList />

        {/* <div>
          TODO: 本 cycle 學習反思調查～
          TODO: 本週的分享狀態
        </div> */}
      </div>
    );
  }
}
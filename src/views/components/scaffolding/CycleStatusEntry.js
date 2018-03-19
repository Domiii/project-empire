import size from 'lodash/size';
import map from 'lodash/map';
import sortBy from 'lodash/sortBy';
import range from 'lodash/range';
import zipObject from 'lodash/zipObject';

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import dataBind from 'src/dbdi/react/dataBind';

import {
  Alert, Button, Badge, Well, Panel
} from 'react-bootstrap';
import Moment from 'react-moment';




/**
 * Each entry is per user/per cycle and, ideally, entails:
 * 
 * 1. Goal
 * 2. summary (title/description) + List of result, for each:
 *    * submission, usually link to portfolio entry(ies)
 *    * process
 * 3. Reflection
 *    * TODO: use reflection to guide process summarization?
 * 4. Peer/Coach feedback + Follow up
 */

      //   <Panel bsStyle="primary">
      //   <Panel.Heading>
      //     <FancyPanelToggleTitle>
      //       歷史紀錄
      //       {currentLearnerScheduleCycleId > 1 && `（第 1 至 ${currentLearnerScheduleCycleId-1} ${currentScheduleCycleName}的狀態）` }
      //     </FancyPanelToggleTitle>
      //   </Panel.Heading>
      //   <Panel.Body collapsible>
      //     <GoalUserHistory />
      //   </Panel.Body>
      // </Panel>


      

const goal = (<Panel bsStyle="primary">
<Panel.Heading>
  第 {currentLearnerScheduleCycleId} {currentScheduleCycleName}的狀態 ❤️
  </Panel.Heading>
<Panel.Body>
  <Well>
    <GoalForm {...goalFormArgs1} />
  </Well>
</Panel.Body>
</Panel>);


const entry = entriesByCycle[cycleId];
if (entry) {
  // has goal
  return (<Alert key={cycleId} bsStyle="success" className="no-margin">
    [第 {cycleId} {currentScheduleCycleName}] {entry.goalTitle} <span className="color-gray"> (
      <Moment fromNow>{entry.createdAt}</Moment>
      )</span>
  </Alert>);
}
else {
  // no goal this cycle
  return (<Alert key={cycleId} bsStyle="warning" className="no-margin">
    [第 {cycleId} {currentScheduleCycleName}] <span className="color-gray">(無目標)</span>
  </Alert>);
}

export default class CycleStatusEntry extends Component {
  render() {
    return 'hi';
  }
}
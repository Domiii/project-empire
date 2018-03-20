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

import GoalForm from 'src/views/components/goals/GoalForm';

//import { NOT_LOADED } from 'src/dbdi/react/dataBind';

import LoadIndicator from 'src/views/components/util/loading';


/**
 * ####################################################################
 * Entry
 * ####################################################################
 */


const GoalView = dataBind({
})(function GoalView(
  { scheduleId, cycleId, uid },
  { get_goalById, get_scheduleCycleName },
  { }
) {
  const goalQuery = {
    scheduleId, cycleId, uid
  };
  const scheduleQuery = {
    scheduleId
  };
  //const goalQuery = { goalId };
  if (!get_goalById.isLoaded(goalQuery) | !get_scheduleCycleName.isLoaded(scheduleQuery)) {
    return <LoadIndicator />;
  }

  const entry = get_goalById(goalQuery);
  const idEl = (<span>[第 {cycleId} {cycleName}]</span>);
  const cycleName = get_scheduleCycleName(scheduleQuery);
  const desc = entry && entry.goalDescription;
  const timeEl = entry && (<span className="color-lightgray"> (
    <Moment fromNow>{entry.createdAt}</Moment>
    )</span>);
  const descEl = desc && (<Well className="no-margin"> {desc} </Well>);

  if (entry) {
    // has goal
    return (<Alert key={cycleId} bsStyle="success" className="no-margin">
      {idEl}
      {entry.goalTitle} {timeEl}
      {descEl}
    </Alert>);
  }
  else {
    // no goal this cycle
    return (<Alert key={cycleId} bsStyle="warning" className="no-margin">
      {idEl}
      <span className="color-gray">(無目標)</span>
    </Alert>);
  }
});

@dataBind()
export class UserCycleStatusEntry extends Component {
  render(
    { scheduleId, cycleId, uid },
    { get_scheduleCycleName },
    { }
  ) {

    const scheduleQuery = {
      scheduleId
    };
    if (!get_scheduleCycleName.isLoaded(scheduleQuery)) {
      return <LoadIndicator />;
    }

    const cycleName = get_scheduleCycleName(scheduleQuery);
    const goalId = {
      scheduleId, cycleId, uid
    };
    let goal;
    const isEditing = true;
    if (isEditing) {
      goal = (<Well>
        <GoalForm {...goalId} />
      </Well>);
    }
    else {
      goal = <GoalView {...goalId} />;
    }

    return (<Panel bsStyle="primary">
      <Panel.Heading>
        第 {cycleId} {cycleName}的狀態 ❤️
      </Panel.Heading>
      <Panel.Body>
        {goal}
      </Panel.Body>
    </Panel>);
  }
}


/**
 * ####################################################################
 * List
 * ####################################################################
 */

const UserCycleStatusList = dataBind({

})(function UserCycleStatusList(
  { },
  { goalsOfAllCycles },
  { currentUid, currentUid_isLoaded,
    currentLearnerScheduleId, currentLearnerScheduleId_isLoaded,
    currentLearnerScheduleCycleId, currentLearnerScheduleCycleId_isLoaded }
) {
  if (!currentUid_isLoaded |
    !currentLearnerScheduleId_isLoaded |
    !currentLearnerScheduleCycleId_isLoaded) {
    return <LoadIndicator />;
  }

  const uid = currentUid;
  const scheduleId = currentLearnerScheduleId;

  if (!goalsOfAllCycles.isLoaded({ uid, scheduleId })) {
    return <LoadIndicator />;
  }

  //const entries = goalsOfAllCycles({ uid, scheduleId });
  //const entriesByCycle = zipObject(map(entries, 'cycleId'), Object.values(entries));

  const cycles = range(currentLearnerScheduleCycleId, 0);

  return (<div>
    {
      map(cycles, (cycleId) => {
        return (<UserCycleStatusEntry key={cycleId} uid={uid} scheduleId={scheduleId} cycleId={cycleId} />);
      })
    }
  </div>);
});

export default UserCycleStatusList;
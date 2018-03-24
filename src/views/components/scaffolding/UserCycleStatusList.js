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
  { get_goalById },
  { }
) {
  const goalId = {
    scheduleId, cycleId, uid
  };
  if (!get_goalById.isLoaded(goalId)) {
    return <LoadIndicator />;
  }
  const goal = get_goalById(goalId);
  const desc = goal && goal.goalDescription;
  const timeEl = goal && (<span className="color-gray"> (
    <Moment fromNow>{goal.createdAt}</Moment>
    )</span>);
  const descEl = desc && (<pre className="no-margin"> {desc} </pre>);
  let bsStyle;
  let children;

  if (goal) {
    // has goal
    bsStyle = 'success';
    children = (<span>
      {goal.goalTitle} {timeEl}
      {descEl}
    </span>);
  }
  else {
    // no goal this cycle
    children = (<span>
      <span className="color-gray">(無目標)</span>
    </span>);
  }

  return (<Alert key={cycleId} bsStyle={bsStyle} className="no-margin">
    {children}
  </Alert>);
});

@dataBind()
export class UserCycleStatusEntry extends Component {
  constructor(...args) {
    super(...args);

    this.state = { isEditing: false };
  }

  toggleEditing = () => {
    this.setState({ isEditing: !this.state.isEditing });
  }

  editButtonEl = () => {
    return (<Button onClick={this.toggleEditing}>
      Edit
    </Button>);
  }

  render(
    { scheduleId, cycleId, uid, bsStyle },
    { get_scheduleCycleName, getProps },
    { }
  ) {
    const goalId = {
      scheduleId, cycleId, uid
    };
    const scheduleQuery = {
      scheduleId
    };
    //const goalQuery = { goalId };
    if (!get_scheduleCycleName.isLoaded(scheduleQuery)) {
      return <LoadIndicator />;
    }

    const cycleName = get_scheduleCycleName(scheduleQuery);
    const title = getProps().title || `第 ${cycleId} ${cycleName}的狀態`;

    let goalEl;
    const { isEditing } = this.state;
    if (isEditing) {
      goalEl = (
        <GoalForm {...goalId} />
      );
    }
    else {
      goalEl = <GoalView {...goalId} />;
    }

    return (<Panel bsStyle={bsStyle}>
      <Panel.Heading>
        {title}
      </Panel.Heading>
      <Panel.Body className="no-padding">
        <Well className="no-margin">
          {goalEl}
          {this.editButtonEl()}
        </Well>
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
  { get_scheduleCycleName },
  { currentUid, currentUid_isLoaded,
    currentLearnerScheduleId, currentLearnerScheduleId_isLoaded,
    currentLearnerScheduleCycleId, currentLearnerScheduleCycleId_isLoaded }
) {
  if (!currentUid_isLoaded |
    !currentLearnerScheduleId_isLoaded |
    !currentLearnerScheduleCycleId_isLoaded |
    !get_scheduleCycleName.isLoaded(scheduleQuery)) {
    return <LoadIndicator />;
  }

  const uid = currentUid;
  const scheduleId = currentLearnerScheduleId;
  const scheduleQuery = {
    scheduleId
  };

  const cycleName = get_scheduleCycleName(scheduleQuery);

  const otherCycles = range(currentLearnerScheduleCycleId - 2, 0);

  const cycle0 = currentLearnerScheduleCycleId;
  const cycle1 = currentLearnerScheduleCycleId - 1;
  const commonProps = { uid, scheduleId };

  return (<div>
    <UserCycleStatusEntry key={cycle0} cycleId={cycle0} bsStyle="primary" title={`本${cycleName}的狀態`} {...commonProps} />
    <UserCycleStatusEntry key={cycle1} cycleId={cycle1} bsStyle="primary" {...commonProps} />
    {
      map(otherCycles, (cycleId) => {
        return (<UserCycleStatusEntry key={cycleId} cycleId={cycleId} bsStyle="default" {...commonProps} />);
      })
    }
  </div>);
});

export default UserCycleStatusList;
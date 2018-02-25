import size from 'lodash/size';
import map from 'lodash/map';
import sortBy from 'lodash/sortBy';
import range from 'lodash/range';
import zipObject from 'lodash/zipObject';

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import dataBind from 'src/dbdi/react/dataBind';

import {
  Alert, Button, Badge, Well
} from 'react-bootstrap';
import Moment from 'react-moment';

import { NOT_LOADED } from 'src/dbdi/react/dataBind';

import LoadIndicator from 'src/views/components/util/loading';


export const GoalCurrentHistory = dataBind({

})(function GoalCurrentHistory(
  { },
  { },
  { currentGoalHistory }
) {
  const entries = currentGoalHistory;
  const entryCount = size(entries);
  return (<div>
    妳想到過的目標包含（{entryCount}）：
    {
      map(entries, (entry, i) => (
        <Badge key={i}>
          {entry.goalDescription} <span className="color-lightgray">(
            <Moment fromNow>{entry.updatedAt}</Moment>
            )</span>
        </Badge>
      ))
    } 
  </div>);
});


export const GoalUserHistory = dataBind({

})(function GoalUserHistory(
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
  
  if (!goalsOfAllCycles.isLoaded({uid, scheduleId})) {
    return <LoadIndicator />;
  }

  const entries = goalsOfAllCycles({uid, scheduleId});

  const entriesByCycle = zipObject(map(entries, 'cycleId'), Object.values(entries));

  const cycles = range(currentLearnerScheduleCycleId, 0);
  
  return (<div>
    {
      map(cycles, (cycleId) => {
        const entry = entriesByCycle[cycleId];
        if (entry) {
          return (<Alert key={cycleId} bsStyle="success" className="no-margin">
            [第 {cycleId} 週] {entry.goalDescription} <span className="color-gray"> (
              <Moment fromNow>{entry.createdAt}</Moment>
              )</span>
          </Alert>);
        }
        else {
          return (<Alert key={cycleId} bsStyle="warning" className="no-margin">
            [第 {cycleId} 週] <span className="color-gray">(無目標)</span>
          </Alert>);
        }
      })
    } 
  </div>);
});
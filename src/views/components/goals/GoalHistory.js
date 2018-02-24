import size from 'lodash/size';
import map from 'lodash/map';

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import dataBind from 'src/dbdi/react/dataBind';

import {
  Alert, Button, Badge
} from 'react-bootstrap';
import Moment from 'react-moment';

const GoalHistory = dataBind({

})(function GoalForm(
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

export default GoalHistory;
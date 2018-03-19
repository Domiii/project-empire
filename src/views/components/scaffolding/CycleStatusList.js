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

//import { NOT_LOADED } from 'src/dbdi/react/dataBind';

import LoadIndicator from 'src/views/components/util/loading';


export const CycleStatusListOfUser = dataBind({

})(function CycleStatusListOfUser(
  { },
  { goalsOfAllCycles },
  { currentUid, currentUid_isLoaded,
    currentScheduleCycleName, currentScheduleCycleName_isLoaded,
    currentLearnerScheduleId, currentLearnerScheduleId_isLoaded,
    currentLearnerScheduleCycleId, currentLearnerScheduleCycleId_isLoaded }
) {
  if (!currentUid_isLoaded |
    !currentScheduleCycleName_isLoaded |
    !currentLearnerScheduleId_isLoaded |
    !currentLearnerScheduleCycleId_isLoaded) {
    return <LoadIndicator />;
  }

  const uid = currentUid;
  const scheduleId = currentLearnerScheduleId;

  if (!goalsOfAllCycles.isLoaded({ uid, scheduleId })) {
    return <LoadIndicator />;
  }

  const entries = goalsOfAllCycles({ uid, scheduleId });

  const entriesByCycle = zipObject(map(entries, 'cycleId'), Object.values(entries));

  const cycles = range(currentLearnerScheduleCycleId, 0);

  return (<div>
    {
      map(cycles, (cycleId) => {
        }
      })
    }
  </div>);
});
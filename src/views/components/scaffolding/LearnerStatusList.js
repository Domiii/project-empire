import map from 'lodash/map';
import isEmpty from 'lodash/isEmpty';
import size from 'lodash/size';
import sortBy from 'lodash/sortBy';
import filter from 'lodash/filter';

import moment from 'moment';

import React from 'react';
import PropTypes from 'prop-types';

import dataBind from 'src/dbdi/react/dataBind';

import Moment from 'react-moment';
import {
  Alert, Button,
  Well, Panel
} from 'react-bootstrap';
import Flexbox from 'flexbox-react';

import LoadIndicator from 'src/views/components/util/loading';

import LearnerStatusEntryView from './LearnerStatusEntryView';
import { EmptyObject } from '../../../util';


const LearnerStatusList = dataBind({
  // eat up the button event
  createDefaultScheduleClick(evt, { }, { createDefaultLearnerSchedule }) {
    return createDefaultLearnerSchedule();
  }
})(
  function LearnerStatusList(
    { scheduleId, cycleId },
    { allGoalsOfUsers, get_learnerSchedule, createDefaultScheduleClick },
    { usersOfCurrentCohort, usersOfCurrentCohort_isLoaded }
  ) {
    if (!usersOfCurrentCohort_isLoaded |
        !get_learnerSchedule.isLoaded({ scheduleId }) |
        !allGoalsOfUsers.isLoaded({ scheduleId, cycleId })
      ) {
      return <LoadIndicator />;
    }
    else {
      const schedule = get_learnerSchedule({ scheduleId });
      const entries = allGoalsOfUsers({ scheduleId, cycleId });
      let uids = Object.keys(usersOfCurrentCohort || EmptyObject);
      //entries = map(entries, (entry, uid) => ({ entry, uid }));

      // sort by whether they have a goal and if so, by last update time
      uids = sortBy(uids, uid => entries[uid] && -entries[uid].updatedAt || 0);
      const nUsers = size(uids);

      let contentEl;
      if (!schedule) {
        return (<Alert bsStyle="danger">
          no schedule :(((
          <Button onClick={createDefaultScheduleClick}>
            Create!
          </Button>
        </Alert>);
      }
      else if (!nUsers) {
        contentEl = (<Alert bsStyle="warning" style={{ display: 'inline' }} className="no-padding">
          <span>ther are no users!</span>
        </Alert>);
      }
      else {
        contentEl = (<div>
          {map(uids, uid => (
            <LearnerStatusEntryView key={uid} uid={uid}
              scheduleId={scheduleId} cycleId={cycleId} />
          ))}
        </div>);
      }

      // TODO: schedule + cycle info
      return (<div>
        <h4><span>
          schedule started: <Moment fromNow>{schedule && schedule.startTime}</Moment>;
          cycleStart: <Moment format="llll">{schedule.startTime - schedule.cycleOffset}</Moment>;
          cycleTime: {moment.duration(schedule.cycleTime).humanize()};
          cycleId: {cycleId};
          ({nUsers} users)
        </span></h4>
        {contentEl}
      </div>);
    }
  }
);

export default LearnerStatusList;
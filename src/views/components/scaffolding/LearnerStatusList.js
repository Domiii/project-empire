import map from 'lodash/map';
import isEmpty from 'lodash/isEmpty';
import size from 'lodash/size';
import sortBy from 'lodash/sortBy';

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


const LearnerStatusList = dataBind({
  // eat up the button event
  createDefaultScheduleClick(evt, { }, { createDefaultLearnerSchedule }) {
    return createDefaultLearnerSchedule();
  }
})(
  function LearnerStatusList(
    { scheduleId, cycleId },
    { learnerEntryIdsOfCycleByAllUsers, get_learnerSchedule, createDefaultScheduleClick },
    { }
  ) {
    if (!get_learnerSchedule.isLoaded({ scheduleId }) |
      !learnerEntryIdsOfCycleByAllUsers.isLoaded({ cycleId })) {
      return <LoadIndicator />;
    }
    else {
      const schedule = get_learnerSchedule({ scheduleId });
      let currentCycleLearnerEntries = learnerEntryIdsOfCycleByAllUsers({ cycleId });
      currentCycleLearnerEntries = map(currentCycleLearnerEntries, (entryId, uid) => ({ entryId, uid }));
      const nUsers = size(currentCycleLearnerEntries);

      // sort by whether there already is an entryId
      currentCycleLearnerEntries = sortBy(currentCycleLearnerEntries, ({ entryId, uid }) => !entryId);

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
          <span>user has no entries yet</span>
        </Alert>);
      }
      else {
        contentEl = (<div>
          {map(currentCycleLearnerEntries, ({entryId, uid}) => (
            <LearnerStatusEntryView key={uid} learnerEntryId={entryId}
              uid={uid} scheduleId={scheduleId} cycleId={cycleId} />
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
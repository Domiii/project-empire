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
    { get_allGoals, get_learnerSchedule, createDefaultScheduleClick },
    { }
  ) {
    if (!get_learnerSchedule.isLoaded({ scheduleId }) |
      !get_allGoals.isLoaded({ scheduleId, cycleId })) {
      return <LoadIndicator />;
    }
    else {
      const schedule = get_learnerSchedule({ scheduleId });
      let goals = get_allGoals({ scheduleId, cycleId });
      goals = map(goals, (goal, uid) => ({ goal, uid }));
      const nUsers = size(goals);

      // sort by whether they have a goal and if so, by last update time
      goals = sortBy(goals, ({ goal, uid }) => goal && -goal.updatedAt || 0);

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
          <span>no goals have been defined in this cycle</span>
        </Alert>);
      }
      else {
        contentEl = (<div>
          {map(goals, ({goal, uid}) => (
            <Well key={uid}>{goal}</Well>
            // <LearnerStatusEntryView key={uid} learnerEntryId={goal}
            //   uid={uid} scheduleId={scheduleId} cycleId={cycleId} />
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
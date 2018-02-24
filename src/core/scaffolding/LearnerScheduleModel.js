/**
 * The ScheduleModel helps organize data by cycles (periods of time).
 * 
 * Learner status updates, observations, reflections and other data needs to be collected
 * over a fixed period of time (e.g. daily, weekly, bi-weekly) which we call "cycle".
 */

import moment from 'moment';

const readers = {
  currentSchedule(
    { },
    { learnerSchedule },
    { currentLearnerScheduleId, currentLearnerScheduleId_isLoaded }
  ) {
    if (!currentLearnerScheduleId_isLoaded ||
      !learnerSchedule.isLoaded({ scheduleId: currentLearnerScheduleId })) {
      return undefined;
    }

    return learnerSchedule({ scheduleId: currentLearnerScheduleId });
  },
  currentLearnerScheduleCycleId(
    { },
    { },
    { currentSchedule, currentSchedule_isLoaded }
  ) {
    if (!currentSchedule_isLoaded) {
      return undefined;
    }

    if (!currentSchedule) {
      return null;
    }

    const now = Date.now();
    const { startTime, cycleOffset, cycleTime } = currentSchedule;
    const dt = now - startTime + cycleOffset;
    return Math.floor(dt / cycleTime) + 1;
  },
};

const writers = {
  // set_currentSchedule({}, { startTime, cycleOffset, cycleTime });
  createDefaultLearnerSchedule(
    { },
    { },
    { },
    { push_learnerSchedule, set_currentLearnerScheduleId }
  ) {
    // starting now
    const startTime = Date.now();

    // by default, each cycle is 1 week
    const cycleTime = 1000 * 60 * 60 * 24 * 7;

    // each cycle starts on Monday at 6 am
    const firstCycleStart = moment().day(1).hour(6).minute(0).second(0);
    const cycleOffset = startTime - firstCycleStart.toDate().getTime();

    const newEntry = push_learnerSchedule({
      startTime,
      cycleTime,
      cycleOffset
    });
    return newEntry.then(() => {
      return set_currentLearnerScheduleId({}, newEntry.key);
    });
  }
};

const LearnerScheduleModel = {
  allLearnerSchedules: {
    path: 'learnerSchedules',
    readers,
    writers,
    children: {
      currentLearnerScheduleId: 'currentScheduleId',
      learnerScheduleList: {
        path: 'list',
        children: {
          learnerSchedule: {
            path: '$(scheduleId)',
            children: {
              scheduleStartTime: 'startTime', // in ticks
              scheduleCycleTime: 'cycleTime', // in ticks
              scheduleCycleOffset: 'cycleOffset' // in ticks
            }
          }
        }
      }
    }
  }
};

export default LearnerScheduleModel;
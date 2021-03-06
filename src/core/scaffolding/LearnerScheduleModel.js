/**
 * The ScheduleModel helps organize data by cycles (periods of time).
 * 
 * Learner status updates, observations, reflections and other data needs to be collected
 * over a fixed period of time (e.g. daily, weekly, bi-weekly) which we call "cycle".
 */

import moment from 'moment';
import { NOT_LOADED } from 'dbdi/util';

const readers = {
  currentScheduleCycleName(
    { },
    { scheduleCycleName },
    { scheduleId, scheduleId_isLoaded }
  ) {
    if (!scheduleId_isLoaded) {
      return NOT_LOADED;
    }

    return scheduleCycleName({ scheduleId });
  },

  currentSchedule(
    { },
    { learnerSchedule },
    { currentLearnerScheduleId, currentLearnerScheduleId_isLoaded }
  ) {
    if (!currentLearnerScheduleId_isLoaded) {
      return NOT_LOADED;
    }

    return learnerSchedule({ scheduleId: currentLearnerScheduleId });
  },

  currentLearnerScheduleCycleId(
    { },
    { learnerScheduleCycleId },
    { currentLearnerScheduleId, currentLearnerScheduleId_isLoaded }
  ) {
    if (!currentLearnerScheduleId_isLoaded) {
      return NOT_LOADED;
    }

    return learnerScheduleCycleId({ scheduleId: currentLearnerScheduleId });
  },

  learnerScheduleCycleId(
    { scheduleId },
    { learnerSchedule },
    { }
  ) {
    const schedule = learnerSchedule({ scheduleId });
    if (!schedule) {
      return schedule; // null or NOT_LOADED
    }

    const now = Date.now();
    const { startTime, cycleOffset, cycleTime } = schedule;
    const dt = now - startTime + cycleOffset;
    return Math.floor(dt / cycleTime) + 1;
  },

  /**
   * Provide properly formatted schedule settings for schedule editing forms
   */
  learnerScheduleSettings(
    { scheduleId },
    { learnerScheduleCycleId },
    { }
  ) {
    if (!learnerScheduleCycleId.isLoaded({ scheduleId })) {
      return NOT_LOADED;
    }

    const cycleId = learnerScheduleCycleId({ scheduleId });
    return {
      scheduleId,
      cycleId
    };
  }
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
  },

  /**
   * 
   */
  learnerScheduleAdjustOffsetForCycleId(
    { scheduleId, cycleId },
    { learnerSchedule },
    { },
    { set_scheduleStartTime }
  ) {
    const schedule = learnerSchedule({ scheduleId });
    if (!schedule) {
      return schedule; // null or NOT_LOADED
    }
    const now = Date.now();

    const { startTime, cycleTime } = schedule;

    const totalTimePassed = now - startTime;
    const inCycleOffset = totalTimePassed % cycleTime;

    const newStartTime = (now - inCycleOffset) - ((cycleId - 1) * cycleTime);

    return set_scheduleStartTime({ scheduleId }, newStartTime);
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
              scheduleCycleName: {
                path: 'scheduleCycleName',
                reader(result) {
                  // default name
                  return result || '週';
                }
              },
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
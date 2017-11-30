/**
 * Learner status updates, observations, reflections and other data needs to be collected
 * over a fixed period of time (e.g. daily, weekly, bi-weekly) which we call "cycle". 
 * 
 * The ScheduleModel helps organize data by cycles (periods of time).
 */

const readers = {
  currentScheduleCycleId(
    { },
    { },
    { currentSchedule }
  ) {
    if (!currentSchedule.isLoaded()) {
      return undefined;
    }

    const now = Date.now();
    const { startTime, cycleOffset, cycleTime } = currentSchedule;
    const dt = now - startTime + cycleOffset;
    return Math.floor(dt/cycleTime) + 1;
  },
};

const writers = {
  // set_currentSchedule({}, { startTime, cycleOffset, cycleTime });
};

const ScheduleModel = {
  path: 'scheduleSettings',
  readers,
  writers,
  children: {
    currentSchedule: {
      path: 'current',
      children: {
        scheduleStartTime: 'startTime', // in ticks
        scheduleCycleTime: 'cycleTime', // in ticks
        scheduleCycleOffset: 'cycleOffset' // in ticks
      }
    },
    scheduleArchive: {
      path: 'archive'
      // TODO
    },
  }
};

export default ScheduleModel;
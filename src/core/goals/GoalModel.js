import pick from 'lodash/pick';
import sortBy from 'lodash/sortBy';

import isPlainObject from 'lodash/isPlainObject';

import { EmptyObject } from 'src/util';

import { NOT_LOADED } from 'src/dbdi/react/dataBind';

/**
 * Cohort data
 */
const goalDataModel = {
  onWrite: [
    'updatedAt',
    'createdAt'
  ],
  children: {
    goalDescription: 'goalDescription',
    updatedAt: 'updatedAt',
    createdAt: 'createdAt'
  }
};

const readers = {
  currentGoalPathQuery(
    { },
    { },
    { currentUid, currentLearnerScheduleId, currentLearnerScheduleCycleId,
      currentUid_isLoaded, currentLearnerScheduleId_isLoaded }
  ) {
    if (!currentLearnerScheduleId_isLoaded | !currentUid_isLoaded) {
      return NOT_LOADED;
    }

    return {
      uid: currentUid,
      scheduleId: currentLearnerScheduleId,
      cycleId: currentLearnerScheduleCycleId,
    };
  },

  currentGoalHistory(
    { },
    { get_goalHistory },
    { currentGoalPathQuery }
  ) {
    if (!currentGoalPathQuery) {
      return NOT_LOADED;
    }

    const entries = get_goalHistory(currentGoalPathQuery);
    const arr = Object.values(entries || EmptyObject);
    return sortBy(arr, (entry) => -entry.updatedAt);
  }
};

const writers = {

};


export default {
  allGoalData: {
    path: '/goals',
    readers,
    writers,
    children: {
      currentGoal: {
        reader(
          { },
          { get_goalOfUserAndCycle },
          { currentGoalPathQuery }
        ) {
          if (!currentGoalPathQuery) {
            return NOT_LOADED;
          }

          return get_goalOfUserAndCycle(currentGoalPathQuery);
        },
        writer(
         goalArgs,
          { get_goalOfUserAndCycle, goalOfUserAndCycle_isLoaded },
          { currentGoalPathQuery },
          { set_goalOfUserAndCycle, push_goalHistoryEntry }
        ) {
          if (!currentGoalPathQuery |
            !goalOfUserAndCycle_isLoaded(currentGoalPathQuery)) {
            return NOT_LOADED;
          }
          
          const newGoal = pick(goalArgs, Object.keys(goalDataModel.children));

          // check if we already had a goal
          let historyUpdate;
          const oldGoal = get_goalOfUserAndCycle(currentGoalPathQuery);
          console.log(oldGoal);
          if (oldGoal && oldGoal.goalDescription && 
            oldGoal.goalDescription !== newGoal.goalDescription) {
            // add old goal as history entry
            // (the creation time of this goal is the time it got last updated)
            oldGoal.createdAt = oldGoal.updatedAt;
            historyUpdate = push_goalHistoryEntry(currentGoalPathQuery, oldGoal);
          }

          // update goal
          const goalUpdate = set_goalOfUserAndCycle(currentGoalPathQuery, newGoal);
          
          return Promise.all([
            goalUpdate,
            historyUpdate
          ]);
        }
      },
      goalsByCycle: {
        path: '$(scheduleId)/$(cycleId)',
        children: {
          goalDataOfUser: {
            path: '$(uid)',
            children: {
              goalOfUserAndCycle: {
                path: 'goal',
                ...goalDataModel
              },
              goalHistory: {
                path: 'history',
                children: {
                  goalHistoryEntry: {
                    path: '$(goalId)',
                    ...goalDataModel
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};
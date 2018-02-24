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
    { get_goalHistoryByUser },
    { currentGoalPathQuery }
  ) {
    if (!currentGoalPathQuery) {
      return NOT_LOADED;
    }

    const entries = get_goalHistoryByUser(currentGoalPathQuery);
    const arr = Object.values(entries || EmptyObject);
    return sortBy(arr, (entry) => -entry.updatedAt);
  }

  // allUidsWithGoalsOfCycle(
  //   { scheduleId, cycleId },
  //   { allGoalsOfUsers },
  //   { }
  // ) {
  //   if (!allGoalsOfUsers.isLoaded({ scheduleId, cycleId })) {
  //     return undefined;
  //   }

  //   const entries = allGoalsOfUsers({ scheduleId, cycleId });
  //   return Object.keys(entries);
  // }
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
          { get_goalsByUser },
          { currentGoalPathQuery }
        ) {
          if (!currentGoalPathQuery) {
            return NOT_LOADED;
          }

          return get_goalsByUser(currentGoalPathQuery);
        },
        writer(
          goalArgs,
          { get_goalsByUser, goalsByUser_isLoaded },
          { currentGoalPathQuery },
          { set_goalsByUser, push_goalHistoryByUserEntry }
        ) {
          if (!currentGoalPathQuery |
            !goalsByUser_isLoaded(currentGoalPathQuery)) {
            return NOT_LOADED;
          }

          const newGoal = pick(goalArgs, Object.keys(goalDataModel.children));

          // check if we already had a goal
          let historyUpdate;
          const oldGoal = get_goalsByUser(currentGoalPathQuery);
          console.log(oldGoal);
          if (oldGoal && oldGoal.goalDescription &&
            oldGoal.goalDescription !== newGoal.goalDescription) {
            // add old goal as history entry
            // (the creation time of this goal is the time it got last updated)
            oldGoal.createdAt = oldGoal.updatedAt;
            historyUpdate = push_goalHistoryByUserEntry(currentGoalPathQuery, oldGoal);
          }

          // update goal
          const goalUpdate = set_goalsByUser(currentGoalPathQuery, newGoal);

          return Promise.all([
            goalUpdate,
            historyUpdate
          ]);
        }
      },
      goalsByCycle: {
        path: '$(scheduleId)/$(cycleId)',
        children: {
          allGoalsOfUsers: {
            path: 'goals',
            children: {
              goalsByUser: {
                path: '$(uid)',
                ...goalDataModel,
              },
            }
          },
          goalHistory: {
            path: 'history',
            children: {
              goalHistoryByUser: {
                path: '$(uid)',
                children: {
                  goalHistoryByUserEntry: {
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
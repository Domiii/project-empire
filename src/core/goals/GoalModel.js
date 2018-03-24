import pick from 'lodash/pick';
import sortBy from 'lodash/sortBy';

import isPlainObject from 'lodash/isPlainObject';

import { EmptyObject } from 'src/util';

import { NOT_LOADED } from 'src/dbdi/react/dataBind';


export const goalSchemaTemplate = {
  name: 'goalData',
  type: 'object',
  properties: [
    {
      id: 'goalTitle',
      type: 'string',
      isOptional: true
    },
    {
      id: 'goalDescription',
      type: 'string',
      isOptional: false
    },
    {
      id: 'createdAt',
      // if(formData) {
      //   return !!formData && !!formData.createdAt;
      // },

      'title': 'Created',
      'type': 'number',
      isOptional: true
    }
  ]
};

/**
 * Cohort data
 */
const goalDataModel = {
  onWrite: [
    'updatedAt',
    'createdAt'
  ],
  children: {
    goalTitle: 'goalTitle',
    goalDescription: 'goalDescription',
    updatedAt: 'updatedAt',
    createdAt: 'createdAt'
  }
};


const goalIndices = {
  uid: ['uid'],
  scheduleId: ['scheduleId'],
  uidScheduleId: ['scheduleId', 'uid'],
  scheduleCycle: ['scheduleId', 'cycleId'],
  goalId: {
    keys: ['uid', 'scheduleId', 'cycleId'],
    isProperty: false // this should never be written as a property
  }
};

const goalHistoryIndices = {
  uid: ['uid'],
  scheduleId: ['scheduleId'],
  uidScheduleId: ['scheduleId', 'uid'],
  scheduleCycle: ['scheduleId', 'cycleId'],
  goalHistoryId: {
    keys: ['uid', 'scheduleId', 'cycleId'],
    isProperty: false // this should never be written as a property
  }
};

const readers = {
  currentGoalId(
    { },
    { },
    { currentUid, currentUid_isLoaded,
      currentLearnerScheduleCycleId, currentLearnerScheduleCycleId_isLoaded,
      currentLearnerScheduleId }
  ) {
    if (!currentLearnerScheduleCycleId_isLoaded | !currentUid_isLoaded) {
      return NOT_LOADED;
    }

    return {
      uid: currentUid,
      scheduleId: currentLearnerScheduleId,
      cycleId: currentLearnerScheduleCycleId,
    };
  },

  currentGoalQuery(
    { },
    { },
    { currentGoalId, currentGoalId_isLoaded }
  ) {
    if (!currentGoalId_isLoaded) {
      return NOT_LOADED;
    }

    return {
      goalId: currentGoalId
    };
  },

  currentGoalHistoryQuery(
    { },
    { },
    { currentGoalId, currentGoalId_isLoaded }
  ) {
    if (!currentGoalId_isLoaded) {
      return NOT_LOADED;
    }

    return {
      goalHistoryId: currentGoalId
    };
  },

  currentGoalHistory(
    { },
    { get_goalHistoryById },
    { currentGoalHistoryQuery, currentGoalHistoryQuery_isLoaded }
  ) {
    if (!currentGoalHistoryQuery_isLoaded) {
      return NOT_LOADED;
    }

    const entries = get_goalHistoryById(currentGoalHistoryQuery);
    const arr = Object.values(entries || EmptyObject);
    return sortBy(arr, (entry) => -entry.updatedAt);
  },

  goalsOfAllCycles(
    { scheduleId, uid },
    { get_goalList },
    { }
  ) {
    const query = {
      uid,
      scheduleId
    };

    if (!get_goalList.isLoaded(query)) {
      return NOT_LOADED;
    }

    return get_goalList(query) || EmptyObject;
  },

  goalsOfAllUsers(
    {scheduleId, cycleId},
    { get_goalList },
    { }
  ) {
    const query = {
      scheduleId,
      cycleId
    };

    if (!get_goalList.isLoaded(query)) {
      return NOT_LOADED;
    }

    return get_goalList(query) || EmptyObject;
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
          { get_goalById },
          { currentGoalQuery, currentGoalQuery_isLoaded }
        ) {
          if (!currentGoalQuery_isLoaded) {
            return NOT_LOADED;
          }

          return get_goalById(currentGoalQuery);
        },
        // writer(
        //   goalArgs,
        //   { get_goalById, get_currentGoalHistoryQuery },
        //   { currentUid, currentUid_isLoaded,
        //     currentGoalQuery, currentGoalQuery_isLoaded,
        //     currentLearnerScheduleId, currentLearnerScheduleCycleId },
        //   { set_goalById, push_goalHistoryByUserEntry }
        // ) {
        //   if ((!currentUid_isLoaded | !currentGoalQuery_isLoaded) ||
        //     !get_goalById.isLoaded(currentGoalQuery)) {
        //     return NOT_LOADED;
        //   }

        //   const newGoal = pick(goalArgs, Object.keys(goalDataModel.children));
        //   newGoal.scheduleId = currentLearnerScheduleId;
        //   newGoal.cycleId = currentLearnerScheduleCycleId;
        //   newGoal.uid = currentUid;

        //   // check if we already had a goal
        //   let historyUpdate;
        //   const oldGoal = get_goalById(currentGoalQuery);
        //   if (oldGoal && 
        //     (oldGoal.goalTitle && oldGoal.goalTitle !== newGoal.goalTitle) ||
        //     (oldGoal.goalDescription && oldGoal.goalDescription !== newGoal.goalDescription)) {
        //     // add old goal as history entry
        //     // (the creation time of this goal is the time it got last updated)
        //     oldGoal.createdAt = oldGoal.updatedAt;
        //     historyUpdate = push_goalHistoryByUserEntry(get_currentGoalHistoryQuery(), oldGoal);
        //   }

        //   // update goal
        //   const goalUpdate = set_goalById(currentGoalQuery, newGoal);

        //   return Promise.all([
        //     goalUpdate,
        //     historyUpdate
        //   ]);
        // }
      },
      allGoals: {
        path: 'actualGoals',
        children: {
          goalList: {
            path: {
              path: 'list',
              indices: goalIndices
            },
            children: {
              goalById: {
                path: {
                  path: '$(goalId)',
                  indices: goalIndices
                },
                ...goalDataModel,
              },
            }
          }
        }
      },
      allGoalHistory: {
        path: 'history',
        children: {
          goalHistroyList: {
            path: 'list',
            children: {
              goalHistoryById: {
                path: {
                  path: '$(goalHistoryId)',
                  indices: goalHistoryIndices
                },
                children: {
                  goalHistoryByUserEntry: {
                    path: {
                      path: '$(archivedGoalId)',
                      indices: goalHistoryIndices
                    },
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
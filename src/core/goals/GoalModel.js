import pick from 'lodash/pick';
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
          { currentUid, currentLearnerScheduleId, currentLearnerScheduleCycleId,
            currentUid_isLoaded, currentLearnerScheduleId_isLoaded }
        ) {
          if (!currentLearnerScheduleId_isLoaded || !currentUid_isLoaded) {
            return NOT_LOADED;
          }

          const pathIds = {
            uid: currentUid,
            scheduleId: currentLearnerScheduleId,
            cycleId: currentLearnerScheduleCycleId,
          };

          return get_goalOfUserAndCycle(pathIds);
        },
        writer(
         goalArgs,
          { get_goalOfUserAndCycle, goalOfUserAndCycle_isLoaded },
          { currentUid, currentLearnerScheduleId, currentLearnerScheduleCycleId,
            currentUid_isLoaded, currentLearnerScheduleId_isLoaded },
          { set_goalOfUserAndCycle, push_goalHistoryOfUserAndCycle }
        ) {
          const pathIds = {
            uid: currentUid,
            scheduleId: currentLearnerScheduleId,
            cycleId: currentLearnerScheduleCycleId,
          };

          const newGoal = pick(goalArgs, Object.keys(goalDataModel.children));

          if (!currentLearnerScheduleId_isLoaded | !currentUid_isLoaded |
            !goalOfUserAndCycle_isLoaded(pathIds)) {
            return NOT_LOADED;
          }

          // update goal
          const goalUpdate = set_goalOfUserAndCycle(pathIds, newGoal);

          // check if we already had a goal
          let historyUpdate;
          const oldGoal = get_goalOfUserAndCycle(pathIds);
          if (oldGoal && oldGoal.goalDescription && 
            oldGoal.goalDescription !== newGoal.goalDescription) {
            // add old goal as history entry
            historyUpdate = push_goalHistoryOfUserAndCycle(pathIds, oldGoal);
          }
          
          return Promise.all([
            goalUpdate,
            historyUpdate
          ]);
        }
      },
      currentGoalHistory: {

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
              goalHistoryOfUserAndCycle: {
                path: 'history',
                children: {
                  goalHistoryList: {
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
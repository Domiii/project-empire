import { EmptyObject } from 'src/util';
import { NOT_LOADED } from '../../dbdi/react';

/**
 * Cohort data
 */
const cohortsById = {
  path: '$(cohortId)',
  onWrite: [
    'updatedAt',
    'createdAt'
  ],
  children: {
    cohortName: 'name',
    cohortDescription: 'description'
  }
};

const readers = {
  currentCohortId(
    { },
    { },
    { currentUser, currentUser_isLoaded }
  ) {
    if (!currentUser_isLoaded) {
      return NOT_LOADED;
    }

    return currentUser.cohortId || null;
  },

  usersOfCurrentCohort(
    { },
    { usersOfCohort },
    { currentCohortId, currentCohortId_isLoaded }
  ) {
    if (!currentCohortId_isLoaded) {
      return NOT_LOADED;
    }

    return usersOfCohort({ cohortId: currentCohortId });
  }
};

const writers = {

};

export default {
  allCohortData: {
    path: '/cohorts',
    readers,
    writers,
    children: {
      cohortList: {
        path: 'list',
        children: {
          cohortsById
        }
      },
      // cohortUsers: {
      //   path: 'users',
      //   children: {
      //     cohortUser: {
      //       path: '$(uid)',
      //       children: {

      //       }
      //     }
      //   }
      // }
    }
  }
};
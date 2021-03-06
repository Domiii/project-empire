import size from 'lodash/size';

import { EmptyObject } from 'src/util';
import { NOT_LOADED } from 'dbdi/react';


const readers = {
  currentCohortId(
    { },
    { },
    { currentUser, currentUser_isLoaded }
  ) {
    if (!currentUser_isLoaded) {
      return NOT_LOADED;
    }

    return currentUser && currentUser.cohortId || null;
  },

  userCountOfCurrentCohort(
    { },
    { usersOfCurrentCohort },
    { }
  ) {
    const users = usersOfCurrentCohort();
    if (users === NOT_LOADED) {
      return NOT_LOADED;
    }
    return size(users);
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
  allCohorts: {
    path: '/cohorts',
    readers,
    writers,
    children: {
      cohortList: {
        path: 'list',
        children: {
          cohortsById: {
            path: '$(cohortId)',
            onWrite: [
              'updatedAt',
              'createdAt'
            ],
            children: {
              cohortName: 'name',
              cohortDescription: 'description'
            }
          }
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
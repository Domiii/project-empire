import { EmptyObject } from 'src/util';

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
      }
    }
  }
};
/**
 * Sprints
 * One project is executed in one or more sprints.
 *
 * Q: What is a sprint? A: https://www.google.com.tw/search?q=project+management+sprint&rlz=&source=lnms&tbm=isch
 */

import { 
  makeRefWrapper,
  m2mIndex
} from 'src/firebaseUtil';

import { EmptyObject, EmptyArray } from 'src/util';

import UserInfoRef from 'src/core/users/UserInfoRef';

const SprintsRef = makeRefWrapper({
  pathTemplate: '/sprints',

  methods: {

  },

  children: {
    byProject: {
      pathTemplate: 'projectId',
      children: {
        sprint: {
          pathTemplate: '$(sprintId)',

          children: {
            num: 'num',
            sprintStatus: 'sprintStatus',
            startTime: 'startTime',
            finishTime: 'finishTime',
          }
        }
      }
    }
  }
});

export default SprintsRef;
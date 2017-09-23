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

import isEmpty from 'lodash/isEmpty';
import map from 'lodash/map';
import includes from 'lodash/includes';

// use `stageId` to encode position in tree

export function decodeStageId(idStr, allStages) {
  const pairs = idStr.split(',');
  // TODO
}

export function encodeStageId(id) {
  // TODO
}

export function makeStageId(stageDef, previousStageId, previousStage) {
  // TODO: How to handle going up or down one level in the stage definition tree?
  let pairs = [];
  let current = stageDef;
  while (!!current) {
    pairs.push(current.id);
    current = current.parent;
  }
  return pairs.reverse().join(',');
}


// Advanced TODOs:
//    * specialized data records (e.g. store fame/karma/gold)
//    * (advanced) communication system with context linkage
//    * one "checklist" (or notes) per individual (e.g. individual feedback by reviewer)




// indices: {
//   projectId: ['projectId']
// },

// queryString({projectId}) {
//   // get all responses by given projectId
//   return this.indices.where({projectId});
// },



const stageDataProps = Object.freeze({
  stageName: 'stageName',
  num: 'num',
  status: 'status',
  startTime: 'startTime',
  finishTime: 'finishTime',
  contributions: {
    pathTemplate: 'contributions',
    children: {
      contribution: {
        pathTemplate: '$(uid)',
        children: {
          contributorStatus: 'contributorStatus',
          data: 'data'
        }
      }
    }
  }
});

const ProjectStagesRef = makeRefWrapper({
  pathTemplate: '/projectStages',

  methods: {

  },

  children: {
    ofProject: {
      pathTemplate: '$(projectId)',
      children: {
        list: {
          pathTemplate: 'list',
          children: {
            stage: {
              pathTemplate: '$(stageId)',
              children: Object.assign({}, stageDataProps)
            }
          }
        }
      }
    }
  }
});

export default ProjectStagesRef;
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

import isArray from 'lodash/isArray';

// use `stageId` to encode position in project stage tree

export function decodeStageId(idStr, allStages) {
  const pairs = idStr.split(',');
  // TODO
}

export function encodeStageId(id) {
  // TODO
}


// StageDefTree + StagePath are the main data structures for navigating the stage tree
class StageDefTree {
  _validateAndSanitizeStages(stages) {
    // TODO: responsible, parent, etc...
    forEachStage(stages, stage => {
    });
  }

  parseStageDefs(stageDefNodes) {
    // TODO: create edge matrix
    /**
     * -> There is always a single start state
     * -> When entering a node that has children, we have two edges: firstChild or nextSibling
     * -> When arriving at the final node of a sub graph, the next node is always the parent
     */
    
  }

  hasEdge(from, to) {
    
  }
}

class StagePath {
  constructor() {
    this.path = [];
    this.traversalStack = [];
  }

  get lastStage() {

  }

  get lastStageDef() {
    
  }

  encode() {

  }

  decode() {

  }

  gotoNext(nextNode) {
    // TODO: loop counters
    // TODO: when we enter a NEW loop: pushCounter()
    // TODO: when we enter a loop we have already been in: ++counter 
    // TODO: when we leave a loop: popCounter()
    //    the current counter always belongs to the inner most ancestor, going upward
    if (hasEdge(currentNode, nextNode)) {
      // three possible scenarios for nextNode: nextSibling, firstChild, parent
      // -> When entering a "firstChild" node of a "loop" node, increase peak() counter by one
    }
    else {
      debugger;
      throw new Error('invalid stage traversal');
    }
  }
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


const GroupSettings = {
  party: {

  },
  reviewer: {
    
  },
  gm: {

  },
  any: {

  }
};

function isUserInGroup(groupName) {

}

function getStageReponsibilityHolders({groups, count}) {
  // TODO: support multiple sets of "responsible"

}

function reponsibilityHolders(groups, count) {
  groups = !isArray(groups) ? [groups] : groups;
  return {groups, count};
}

export function forEachStage(stages, cb) {
  // TODO
}

const Views = {

};

const Checklists = {
  // TODO
  partyPrepareMeeting: {},
  reviewerPrepareMeeting: {}
};

const StakeHolders = {
  none: 0,
  party: 1,
  partyMember: 2,
  reviewer: 3,
  gm: 4,
  all: 5
};

const DefaultPrivs = {
  statusRead: ['all'],  // see status of "writers" (whether writers have written or not)
  //summaryRead: ['all'], // see summary + anonymous visualizations
  read: ['party'],      // see detailed contents
  write: ['reviewer']   // fill out checklist (write data)
};

export const StageStatus = {
  None: 0,
  NotStarted: 1,
  Started: 2,
  Finished: 3,
  Failed: 4
};

export const ProjectStages = [
  {
    id: 'prepare',
    title: '[進階] 開始執行之前的暖身開會',
    level: 2, // advanced option, only for those who want to be serious about stuff
    checklists: [
      // TODO: how to prepare for a collaborative mission properly?
    ],
    resonponsible: reponsibilityHolders('party', 1)
  },
  {
    id: 'sprint',
    title: 'Sprint',
    canRepeat: true,
    children: [
      {
        id: 'execution',
        title: '執行階段',
        description: '就做一做～',
        noStatus: true
      },
      {
        id: 'partyPrepareMeeting',
        title: '團隊 準備 團隊鑑定',
        checklists: [
          {
            id: 'partyPrepareMeeting',
            read: ['reviewer'],
            write: ['party']
          }
        ]
      },
      {
        id: 'reviewerPrepareMeeting',
        title: '支持者 準備 團隊鑑定',
        checklists: [
          {
            id: 'reviewerPrepareMeeting',
            read: ['reviewer'],
            write: ['reviewer']
          }
        ]
      },
      {
        id: 'holdMeeting',
        title: '團隊鑑定',
        checklists: [
          {
            id: 'reviewerMeetingRecords',
            read: ['reviewer'],
            write: ['reviewer']
          },
          {
            id: 'partyMeetingRecords',
            write: ['party']
          }
        ]
      },
      {
        id: 'postSprintReflection',
        title: '[進階] 團隊鑑定過後',
        level: 2,
        checklists: [
          {
            id: 'reviewerPostSpringReflection',
            read: ['all'],
            write: ['reviewer']
          },
          {
            id: 'partyPostSpringReflection',
            write: ['party']
          }
        ]
      }
    ]
  },
  {
    id: 'wrapup',
    title: '專案總點：一起思考過程喜歡與不喜歡的～'
  }
];



const stageProps = Object.freeze({
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
    byProject: {
      pathTemplate: '$(projectId)',
      children: {
        list: {
          pathTemplate: 'list',
          children: {
            stage: {
              pathTemplate: '$(stageId)',
              children: Object.assign({}, stageProps)
            }
          }
        }
      }
    }
  }
});

export default ProjectStagesRef;
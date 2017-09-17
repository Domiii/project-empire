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
import isEmpty from 'lodash/isEmpty';
import map from 'lodash/map';
import noop from 'lodash/noop';
import includes from 'lodash/includes';

// use `stageId` to encode position in tree

export function decodeStageId(idStr, allStages) {
  const pairs = idStr.split(',');
  // TODO
}

export function encodeStageId(id) {
  // TODO
}

export function asArray(elOrArray) {
  if (isArray(elOrArray)) {
    return Object.assign({}, elOrArray);
  }
  else if (elOrArray !== undefined) {
    return [elOrArray];
  }
  return [];
}

class StageDefNode {
  stageTree;
  parent;
  stageDef;
  isLoop;
  depth;
  order;

  /**
   * Previous sibling in line
   */
  previous;
  
  /**
   * Next sibling in line
   */
  next;

  /**
   * First child node (if node has children)
   */
  firstChild;

  constructor(stageTree, parent, stageDef, depth, order) {
    this.stageTree = stageTree;
    this.parent = parent;
    this.stageDef = stageDef;
    this.isLoop = stageDef.isLoop || false;
    this.depth = depth;
    this.order = order;
  }
  
  get IsRoot() {
    return !this.previous && !this.parent;
  }

  get IsLeaf() {
    return !this.next;
  }

  mapDFS(cb) {
    cb = cb || noop;
    const arr = [];
    this.forEachDFS(node => arr.push(cb(node)));
    return arr;
  }
  

  /**
   * Run callback on all nodes in sub tree.
   * Returns set of all visited nodes.
   */
  forEachDFS(cb) {
    const { next, firstChild } = this;

    cb && cb(this);

    // go down
    firstChild && firstChild.forEachDFS(cb);

    // go to next sibling
    next && next.forEachDFS(cb);
  }

  // iterate over this node and all it's siblings (in order)
  forEachInLine(cb) {
    if (!cb) return;

    // call cb on first child
    cb(this);

    // keep going...
    this.forEachSiblingAfterThis(cb);
  }

  // iterate over following siblings
  forEachSiblingAfterThis(cb) {
    const { next } = this;
    next && cb && next.forEachInLine(cb);
  }

  mapLine(cb) {
    const arr = [];
    this.forEachInLine(node => arr.push(cb(node)));
    return arr;
  }

  /**
   * Return the last sibling, following this node
   */
  getLastSibling() {
    let node = this;
    let { next } = node;

    while (next) {
      node = next;
      next = node.next;
    }

    return node;
  }
}

// StageDefTree + StagePath are the main data structures for navigating the stagetree
class StageDefTree {
  root;

  constructor(stageDefs) {
    this._validateAndSanitizeStages(stageDefs);
    this.root = this._createSubTree(stageDefs);
  }

  hasEdge(from, to) {
    
  }

  mapDFS(...args) {
    return this.root.mapDFS(...args);
  }
  
  forEachDFS(...args) {
    return this.root.forEachDFS(...args);
  }

  _validateAndSanitizeStages(stageDefs) {
    // TODO: responsible, parent, etc...
    // this.forEachStage(stageDefs, stageDef => {
    // });
  }

  _createSubTree(stageDefs, parentNode = null, depth = 0) {
    console.assert(isArray(stageDefs));

    if (!stageDefs) {
      return null;
    }

    let previousNode = null;
    let firstNode = null;
    for (let i = 0; i < stageDefs.length; ++i) {
      const stageDef = stageDefs[i];
      const node = new StageDefNode(this, parentNode, stageDef, depth, i);

      // remember first node, so we can return it at the end
      firstNode = firstNode || node;

      if (previousNode) {
        // add linkage beetween siblings
        previousNode.next = node;
        node.previous = previousNode;
      }
      
      // create child nodes
      const { children } = stageDef;
      children && this._createSubTree(children, node, depth+1) || null;

      // move to next
      previousNode = node;
    }
    if (!!parentNode) {
      parentNode.firstChild = firstNode;
    }
    return firstNode;
  }
}

/**
 * An actual path of a party traversing a project and all its stages
 */
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
    if (this.hasEdge(currentNode, nextNode)) {
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


// TODO: get important data

const GroupSettings = {
  party: {

  },
  reviewer: {
    
  },
  gms: {

  },
  any: {

  }
};

function isUserInGroup(user, groupName) {

}

function isCurrentUserInGroup(user, groupName) {

}

function getStageStakeHolders({groups, count}) {
  // TODO: support multiple sets of "stake holders"

}

function stakeHolders(groups, count) {
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

export const ProjectStageTree = new StageDefTree([
  {
    id: 'prepare',
    title: '[進階] 開始執行之前的暖身開會',
    level: 2, // advanced option, only for those who want to be serious about stuff
    checklists: [
      // TODO: how to prepare for a collaborative mission properly?
    ],
    resonponsible: stakeHolders('party', 1)
  },
  {
    id: 'sprint',
    title: 'Sprint',
    isLoop: true,
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
]);



const stageDataProps = Object.freeze({
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
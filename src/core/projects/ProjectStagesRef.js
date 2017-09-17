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

// use `stageId` to encode position in graph

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
  isLoop;
  nDepth;
  nOrder;
  previous;
  next;

  get IsRoot() {
    return isEmpty(this.previous);
  }

  get HasNext() {
    return !isEmpty(this.next);
  }

  constructor(stageDef, nDepth, nOrder, previousDefOrDefs) {
    this.isLoop = stageDef.isLoop;
    this.nDepth = nDepth;
    this.nOrder = nOrder;
    this.previous = asArray(previousDefOrDefs);
    this.next = [];
  }

  /**
   * Run callback on all nodes in sub graph.
   * Returns set of all visited nodes.
   */
  forEachNodeDFS(cb) {
    cb = cb || noop;
    let node = this;

    // Note: we need to remember the set of all visited nodes to prevent infinite loops
    const visited = new Set();
    do {
      cb(this);
      visited.add(this);

      this.next.forEach(nextNode => {
        // make sure, we don't go back up and don't visit any node twice
        if (nextNode.nDepth >= this.nDepth && !visited.has(nextNode)) {
          cb(nextNode);
          visited.add(nextNode);

          nextNode.forEachNodeDFS(cb);
        }
      });
    } while (!!node);
    return visited;
  }

  /**
   * Return all leafs of subgraph
   */
  getLeafs() {
    const leafs = [];
    this.forEachNodeDFS(node => {
      if (!node.HasNext) {
        leafs.push(node);
      }
    });
    return leafs;
  }
}

// StageDefGraph + StagePath are the main data structures for navigating the stagegraph
class StageDefGraph {
  root;

  constructor(stageDefs) {
    this._validateAndSanitizeStages(stageDefs);
    this.root = this._createSubGraph(stageDefs);
  }

  _validateAndSanitizeStages(stageDefs) {
    // TODO: responsible, parent, etc...
    // this.forEachStage(stageDefs, stageDef => {
    // });
  }

  _createSubGraph(stageDefs, parentNode = null, nDepth = 0) {
    console.assert(isArray(stageDefs));

    if (!stageDefs) {
      return null;
    }

    let previousNode = parentNode;
    let firstNode = null;
    for (let i = 0; i < stageDefs.length; ++i) {
      const stageDef = stageDefs[i];
      const { children } = stageDef;
      const node = new StageDefNode(stageDefs[i], nDepth, i, previousNode);

      // remember first node, so we can return it at the end
      firstNode = firstNode || node;

      if (previousNode) {
        // add edge from previous to current node
        previousNode.next.push(node);
      }
      
      // create child nodes:
      //let firstChildNode = children && this._createSubGraph(children, node, nDepth+1) || null;
      let firstChildNode = null;
      
      if (stageDef.isLoop) {
        // "loop nodes" have an extra edge back from the last child
        // NOTE: `getLeafs` only works now. Last child will link back to loop node.
        const leafs = firstChildNode && firstChildNode.getLeafs() || null;
        node.previous.push(leafs || node);
        
        // in case, "loop node" has no children, 
        //  it has a "self-loop" or "edge connected to itself"
        firstChildNode = firstChildNode || node;
      }

      firstChildNode && node.next.push(firstChildNode);
      previousNode = node;
    }
    return firstNode;
  }

  hasEdge(from, to) {
    
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
  // TODO: How to handle going up or down one level in the stage definition graph?
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

export const ProjectStages = new StageDefGraph([
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
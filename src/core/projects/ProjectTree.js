import {
  pathToIteration,
  pathGetParentPath,
  pathToChild,
  pathGetStageId,
  pathToNextIteration
} from './ProjectPath';

import forEach from 'lodash/forEach';
import mapValues from 'lodash/mapValues';
import isArray from 'lodash/isArray';
import isFunction from 'lodash/isFunction';
import last from 'lodash/last';
import noop from 'lodash/noop';
import uniq from 'lodash/uniq';

import { interject } from 'src/util/miscUtil';

import { EmptyObject, EmptyArray } from 'src/util';


export function asArray(objOrArray) {
  if (isArray(objOrArray)) {
    return Object.assign({}, objOrArray);
  }
  else if (objOrArray !== undefined) {
    return [objOrArray];
  }
  return [];
}

export const StageTransitionTypes = {
  Start: 1,
  NextInLine: 2,
  ParentToChild: 3,
  /**
   * NOTE: For purposes of linearization, these edges get sacrificed
   * If we wanted to keep this transition, traversal
   * would generate a chain of edges between two "visitable" nodes.
   */
  ChildToParent: 4,
  NextIteration: 5
};

export class StageDefNode {
  stageTree;
  parent;
  stageDef;
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


  childrenById;
  siblingsById;

  formsByGroupName;

  constructor(stageTree, parent, stageDef, depth, order) {
    this.stageTree = stageTree;
    this.parent = parent;
    this.stageDef = stageDef;
    this.depth = depth;
    this.order = order;
    this.childrenById = {};
    this.siblingsById = {};

    this.formsByGroupName = {};
    if (stageDef && stageDef.forms) {
      forEach(stageDef.forms || EmptyArray, form => {
        const write = form.write || [''];
        forEach(write, groupName => {
          let arr = this.formsByGroupName[groupName];
          if (!arr) {
            arr = this.formsByGroupName[groupName] = [];
          }
          arr.push(form);
        });
      });
      this.formsByGroupName = mapValues(this.formsByGroupName, uniq);
    }
  }

  get stageId() {
    return this.stageDef && this.stageDef.id || '';
  }

  get isRoot() {
    return !this.previous && !this.parent;
  }

  get isLastInLine() {
    return !this.next;
  }

  get isRepeatable() {
    return this.stageDef && this.stageDef.isRepeatable || false;
  }

  get isFirstChild() {
    return !this.previous;
  }

  get hasChildren() {
    return !!this.firstChild;
  }

  getForms(groupName) {
    return this.formsByGroupName[groupName] ||
      this.formsByGroupName[''];
  }

  getChild(stageId) {
    if (!this.childrenById[stageId]) {
      throw new Error('invalid child stageId: ' + stageId);
    }
    return this.childrenById[stageId];
  }

  getSibling(stageId) {
    //return this.childrenById[stageId];
    if (!this.siblingsById[stageId]) {
      throw new Error('invalid sibling stageId: ' + stageId);
    }
    return this.siblingsById[stageId];
  }

  mapDFS(cb) {
    cb = cb || noop;
    const arr = [];
    this.forEachDFS(node => arr.push(cb(node)));
    return arr;
  }

  forEachChild(cb) {
    this.firstChild && this.firstChild.forEachInLine(cb);
  }

  mapChildren(cb) {
    if (!this.hasChildren) {
      return undefined;
    }
    return this.firstChild && this.firstChild.mapLine(cb) || EmptyArray;
  }


  /**
   * Run callback on all nodes in sub tree.
   */
  forEachDFS(cb) {
    const { next, firstChild } = this;

    cb && cb(this);

    // go down
    firstChild && firstChild.forEachDFS(cb);

    // go to next sibling
    next && next.forEachDFS(cb);
  }

  /**
   * iterate over this node and all siblings following this node (in order)
   */
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
   * Return the last sibling, after this node
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

  getParentPathOfPath(stagePath) {
    // there is a global function for this (not context-sensitive)
    return pathGetParentPath(stagePath);
  }

  traverse(parentPreviousPath, path, stageEntries, cb, iteration = undefined) {
    const stageEntry = stageEntries && stageEntries[path];
    let previousPath = parentPreviousPath;
    const makeChildren = !this.hasChildren ? null : () => this.mapChildren(node => {
      const childPath = pathToChild(path, node.stageId);
      let results;
      if (node.isRepeatable) {
        [previousPath, results] =
          node.traverseIterations(previousPath, childPath, stageEntries, cb);
      }
      else {
        results = node.traverse(previousPath, childPath, stageEntries, cb);
        previousPath = childPath;
      }
      return results;
    });
    return cb(this, parentPreviousPath, path, stageEntry, makeChildren, iteration);
  }

  traverseIterations(previousPath, basePath, stageEntries, cb) {
    let iteration = 0;
    let path = pathToIteration(basePath, iteration);
    const results = [];

    // at least generate one iteration
    results.push(this.traverse(previousPath, path, stageEntries, cb, iteration));
    if (stageEntries) {
      // check for more iterations
      while (
        (previousPath = path) &&
        (path = pathToIteration(basePath, ++iteration)) &&
        (stageEntries[path])
      ) {
        results.push(this.traverse(previousPath, path, stageEntries, cb, iteration));
      }
      --iteration;
    }
    return [pathToIteration(basePath, iteration), results];
  }


  // _chachedPathData;
  // _cachedPath;

  // decodeStageEntries(pathData) {
  //   if (this._cachedPath && this._cachedPathData === pathData) {
  //     return this._cachedPath;
  //   }
  //   let path = new StagePath(null, this.root, 0);
  //   forEach(pathData, (stageEntry, pathStr) => {
  //     const childPath = path.addDescendantPath(pathStr);
  //     childPath.stageEntry = stageEntry;
  //   });
  //   this._cachedPath = path;
  //   this._cachedPathData = pathData;
  //   return path;
  // }
}

// StageDefTree + StagePath are the main data structures for navigating the stagetree
export class StageDefTree {
  root;
  allNodesById;

  constructor(stageDefs) {
    this.allNodesById = {
      '': this.root = new StageDefNode(this, null, null, 0, 0)
    };
    this._createSubTree(stageDefs, this.allNodesById, this.root, 1);
    this._validateAndSanitizeStages();
  }

  hasEdge(from, to) {

  }

  mapDFS(...args) {
    return this.root.mapDFS(...args);
  }

  forEachDFS(...args) {
    return this.root.forEachDFS(...args);
  }

  getNode(stageId) {
    const node = this.allNodesById[stageId];
    if (!node) {
      throw new Error(`invalid ProjectTree Node "${stageId}"`);
    }
    return node;
  }

  /**
   * Get the node that is last in the given path
   */
  getNodeByPath(stagePath) {
    // get stageId
    try {
      const stageId = pathGetStageId(stagePath);
      return this.getNode(stageId);
    }
    catch (err) {
      throw new Error(`could not getNodeByPath for "${stagePath}"`);
    }
  }
  
  /**
   * For repeating nodes, if next iteration exists, go to that, 
   * else go to next node in line
   */
  getNextPathByPath(stagePath, allStagePaths) {
    const node = this.getNodeByPath(stagePath);
    if (node.isRepeatable) {
      const path = pathToNextIteration(stagePath);
      if (!path || !!allStagePaths[path]) {
        return path;
      }
    }

    let nextNode = node.next;
    if (!nextNode) {
      // no more sibling → go up one
      nextNode = node.parent;
      nextNode = nextNode && nextNode.next;
    }
    if (nextNode.firstChild) {
      // TODO: finish the recursion
      return nextNode.firstChild;
    }
    return nextNode;
  }

  traverse(stageEntries, cb) {
    return this.root.traverse('', '', stageEntries, cb);
  }

  _validateAndSanitizeStages(stageDefs) {
    // TODO: responsible, parent, etc...
    this.forEachDFS(node => {
      if (node.stageDef) {
        node.stageDef.contributors = asArray(node.stageDef.contributors);
      }
    });
  }

  _createSubTree(stageDefs, allNodesById, parentNode = null, depth = 0) {
    console.assert(isArray(stageDefs));

    if (!stageDefs) {
      return null;
    }

    let previousNode = null;
    let firstNode = null;
    let newNodesById = {};
    for (let i = 0; i < stageDefs.length; ++i) {
      const stageDef = stageDefs[i];
      const node = new StageDefNode(this, parentNode, stageDef, depth, i);
      allNodesById[stageDef.id] = node;
      newNodesById[stageDef.id] = node;

      // remember first node, so we can return it at the end
      firstNode = firstNode || node;

      if (previousNode) {
        // add linkage beetween siblings
        previousNode.next = node;
        node.previous = previousNode;
      }

      // create child nodes
      const { children } = stageDef;
      children && this._createSubTree(children, allNodesById, node, depth + 1);

      // move to next
      previousNode = node;
    }
    if (!!parentNode) {
      parentNode.firstChild = firstNode;
      parentNode.childrenById = newNodesById;
    }
    firstNode.siblingsById = newNodesById;
    return firstNode;
  }
}
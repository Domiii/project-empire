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

  traverse(parentPreviousPath, path, stageEntries, cb, iteration = undefined) {
    const stageEntry = stageEntries && stageEntries[path];
    let previousPath = path;
    const children = this.mapChildren(node => {
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
    return cb(this, parentPreviousPath, path, stageEntry, children, iteration);
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
      let stageId;
      let idx = stagePath.lastIndexOf('_');
      stageId = stagePath.substring(idx + 1);
      if (!isNaN(parseInt(stageId))) {
        // iteration node
        const idx2 = stagePath.lastIndexOf('_', idx - 1);
        stageId = stagePath.substring(idx2 + 1, idx);
      }
      return this.getNode(stageId);
    }
    catch (err) {
      throw new Error(`could not getNodeByPath for "${stagePath}"`);
    }
  }

  getParentPathOfPath(stagePath) {
    try {
      let i = 0;
      let idx = stagePath.length;
      let idx2 = idx;
      do {
        idx2 = stagePath.lastIndexOf('_', idx - 1);
        const stageId = stagePath.substring(idx2 + 1, idx);
        if (isNaN(parseInt(stageId))) {
          // not an iteration -> stepping stone in hierarchy
          console.assert(this.getNode(stageId));
          ++i;
        }
        idx = idx2;
      }
      while (i < 1);
      return stagePath.substring(0, idx);
    }
    catch (err) {
      throw new Error(`could not getParentPathOfPath for "${stagePath}"`);
    }
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

/**
 * TODO: ???
 * An actual path of a party traversing a project and all its stages
 */
export class StagePath {
  parentPath;
  pathStr;
  node;
  iteration;
  children;

  stageEntry;

  constructor(parentPath, pathStr, node, iteration) {
    this.parentPath = parentPath;
    this.pathStr = pathStr;
    this.node = node;
    this.iteration = iteration;

    this._buildChildPaths();
  }

  // #########################################################################
  // Private members
  // #########################################################################

  _buildChildPaths() {
    this.children = {};
    this.node.forEachChild(this._addChildStage);
  }

  _addChildStage = (childNode) => {
    const pathStr = this.pathStr + '_' + childNode.stageId;
    const childPath = this.children[childNode.stageId] = new StagePath(this, pathStr, childNode);
    if (childNode.isRepeatable) {
      // add first iteration as child
      childPath._addNewIteration(0);
    }
    return childPath;
  }

  _addNewIteration = (iteration) => {
    console.assert(!isNaN(this.iteration));
    const pathStr = this.pathStr + '_' + iteration;
    return this.children[iteration] = new StagePath(this, pathStr, this.node, iteration);
  }


  // #########################################################################
  // Public members
  // #########################################################################

  get tree() {
    return this.node.tree;
  }

  get isIterationNode() {
    // NOTE: using this.node here is not enough, since the repeating loop is also
    //    the node of the parent path
    return !isNaN(this.iteration);
  }

  encode() {
    return this.pathStr;
  }

  getChildPath(childStageId) {
    return this.children[childStageId];
  }

  addDescendantPath(pathStr) {
    const parts = pathStr.split('_');
    let path = this;
    try {
      for (let iPart = 0; iPart < parts.length; ++iPart) {
        const part = parts[iPart];
        const iteration = parseInt(part);
        if (isNaN(iteration)) {
          // new stage
          const childPathId = part;
          path = this.getChildPath(childPathId);
          if (!path) {
            // create new path node
            path = this._addChildStage(this.node.getChild(childPathId));
          }
        }
        else {
          // same stage, different iteration
          path = this._addNewIteration(iteration);
        }
      }
    }
    catch (err) {
      throw new Error(`could not parse StagePath "${parts.join('/')}" - ` + err.stack);
    }

    return path;
  }

  toString() {
    return this.encode();
  }
}

export function pathToChild(parentPathStr, stageId) {
  return (parentPathStr && (parentPathStr + '_') || '') + stageId;
}

export function pathToIteration(parentPathStr, iteration) {
  return (parentPathStr && (parentPathStr + '_') || '') + iteration;
}
import forEach from 'lodash/forEach';
import isArray from 'lodash/isArray';
import noop from 'lodash/noop';

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

  constructor(stageTree, parent, stageDef, depth, order) {
    this.stageTree = stageTree;
    this.parent = parent;
    this.stageDef = stageDef;
    this.depth = depth;
    this.order = order;
    this.childrenById = {};
    this.siblingsById = {};
  }

  get stageId() {
    return this.stageDef.id;
  }

  get isRoot() {
    return !this.previous && !this.parent;
  }

  get isLeaf() {
    return !this.next;
  }

  get isRepeatable() {
    return this.stageDef.isRepeatable || false;
  }

  get hasChildren() {
    return !!this.firstChild;
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
    if (this.hasChildren) {
      const arr = [];
      this.forEachInLine(node => arr.push(cb(node)));
      return arr;
    }
    return undefined;
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

  traverse(path, stageEntries, cb, iteration = undefined) {
    const children = this.mapLine(node => {
      const childPath = pathToChild(path, node.stageId);
      if (node.isRepeatable) {
        return node.traverseIterations(childPath, stageEntries, cb);
      }
      else {
        return node.traverse(childPath, stageEntries, cb);
      }
    });
    const stageEntry = stageEntries[this.stageId];
    return cb(this, path, stageEntry, children, iteration);
  }

  traverseIterations(basePath, stageEntries, cb) {
    let iteration = 0;
    let path;
    const results = [];
    while ((path = pathToIteration(basePath, iteration)) && (stageEntries[path])) {
      results.push(this.traverse(path, stageEntries, cb, iteration));
      ++iteration;
    }
    return results;
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
  nodesById;

  constructor(stageDefs) {
    this.nodesById = {};
    this.root = this._createSubTree(stageDefs, this.nodesById);
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
    return this.root.getChild(stageId);
  }

  traverse(stageEntries, cb) {
    return this.root.traverse('', stageEntries, cb);
  }

  _validateAndSanitizeStages(stageDefs) {
    // TODO: responsible, parent, etc...
    this.forEachDFS(node => {
      node.stageDef.contributors = asArray(node.stageDef.contributors);
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
  return parentPathStr + '_' + stageId;
}

export function pathToIteration(parentPathStr, iteration) {
  return parentPathStr + '_' + iteration;
}
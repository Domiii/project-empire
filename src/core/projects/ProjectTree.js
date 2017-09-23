import isArray from 'lodash/isArray';
import noop from 'lodash/noop';


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
export class StageDefTree {
  root;

  constructor(stageDefs) {
    this.root = this._createSubTree(stageDefs);
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

  _validateAndSanitizeStages(stageDefs) {
    // TODO: responsible, parent, etc...
    this.forEachDFS(node => {
      node.stageDef.contributors = asArray(node.stageDef.contributors);
    });
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
      children && this._createSubTree(children, node, depth + 1);

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
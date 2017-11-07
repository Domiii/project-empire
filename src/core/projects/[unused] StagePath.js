
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
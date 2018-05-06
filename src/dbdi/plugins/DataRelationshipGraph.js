/**
 * many2many indexing (only working for Firebase-style data organization for now)
 */

import size from 'lodash/size';
import filter from 'lodash/filter';
import every from 'lodash/every';
import forEach from 'lodash/forEach';
import map from 'lodash/map';
import mapValues from 'lodash/mapValues';
import isString from 'lodash/isString';
import zipObject from 'lodash/zipObject';
import times from 'lodash/times';
import uniq from 'lodash/uniq';

import pluralize from 'pluralize';

import autoBind from 'src/util/auto-bind';

import { EmptyObject, EmptyArray } from '../../util';
import { NOT_LOADED } from '../react';
import { getOptionalArgument } from '../dataAccessUtil';
import { getFirstVariableInPathTemplate } from './PathUtil';

/**
 * ####################################################################################
 * Name management
 * 
 * The overall naming scheme explained:
 *    -> "a" has many, "b" has 1
 *    -> "a" belongsTo "b", "b" hasMany "a"
 *    -> "a" is owned by "b", "b" owns "a"
 *    -> Example: a = 'user', b = 'project' => asOfB => usersOfProject
 * ####################################################################################
 */

/**
 * We want the lower-case names (and capitalize the name ourselves).
 * For simplicity sake, we only work with alphanumerical names for now.
 */
const validNameRe = /[a-z_$][0-9a-zA-Z_$]*/;

function capitalize(name) {
  return name.replace(/(^|\s)\S/g, l => l.toUpperCase());
}

const _allNameProxies = {};

const _relationshipNameGenerators = {
  asOfB: (n) => `${n.as}Of${n.B}`, // (usersOfProject)
  aIdsOfBs: (n) => `${n.aIds}Of${n.Bs}`, // (uidsOfProjects)
  aIdsOfB: (n) => `${n.aIds}Of${n.B}`, // (uidsOfProject)
  aIdOfB: (n) => `${n.aId}Of${n.B}`, // (uidOfProject)
  countAsOfB: (n) => `count${n.As}Of${n.B}`, // (countUsersOfProject)
  anyAsOfB: (n) => `any${n.As}Of${n.Bs}`, // (anyUsersOfProject)
  bIdsWithoutA: (n) => `${n.bIds}Without${n.A}`, // (projectIdsWithoutUser)
};

const _nameProxyHandler = {
  get(obj, prop) {
    const fn = _relationshipNameGenerators[prop];
    if (fn) {
      return fn(obj);
    }

    if (!obj[prop]) {
      throw new Error(`invalid name does not exist: ${prop} for (${obj.toString()})`);
    }
    return obj[prop];
  }
};

function _validateName(name) {
  if (!validNameRe.test(name)) {
    throw new Error(`invalid name in data relationship: ${name} - must be alphanumerical AND start lower-case!`);
  }
  if (name !== pluralize(name)) {
    throw new Error(`invalid name in data relationship: ${name} - must be singular and different from it's own plural`);
  }
}

/**
 * Do some sanity checks on all names, to avoid naming conflicts.
 * This is because we will automatically generate all kinds of names automatically, and 
 * that can get ugly real soon real fast.
 */
function _validateNames(allNames) {
  // overall criteria
  if (uniq(allNames).length < allNames.length) {
    throw new Error(`invalid name in data relationship: "${allNames.join('_')}" - both names, and both variable names all must be unique`);
  }

  // individual criteria
  allNames.forEach(_validateName);
}


function pathForVar(varName) {
  return `$(${varName})`;
}



function getIdNameFromPathTemplate(pathTemplate) {
  const idName = getFirstVariableInPathTemplate(pathTemplate);
  if (!idName) {
    throw new Error(`invalid "hasMany" relationship - can only be added to nodes with single variable in path: '${pathTemplate}'`
      // +'- HINT: you can add "indices" to the node (possibly with isProperty set to false), to have a single variable represent multiple values'
    );
  }
  return idName;
}


/**
 * Generate names.
 */
function _getNameProxy(...allNames) {
  const [aName, bName, aIdName, bIdName, bListName] = allNames;
  const nameSetId = allNames.join('_');
  if (_allNameProxies[nameSetId]) {
    return _allNameProxies[nameSetId];
  }

  // check if all names satisfy criteria
  _validateNames(allNames);

  // build all the names
  const n = {
    a: aName,
    b: bName,
    aId: aIdName,
    bId: bIdName,
    bList: bListName
  };
  Object.assign(n, {
    A: capitalize(n.a),
    B: capitalize(n.b),
    AId: capitalize(n.aId),
    BId: capitalize(n.bId),

    as: pluralize(n.a),
    bs: pluralize(n.b),
    aIds: pluralize(n.aId),
    bIds: pluralize(n.bId)
  });
  Object.assign(n, {
    As: pluralize(n.A),
    Bs: pluralize(n.B),
    AIds: pluralize(n.AId),
    BIds: pluralize(n.BId)
  });

  // build proxy
  const p = new Proxy(n, _nameProxyHandler);
  n.toString = p.toString = () => `Names for ${nameSetId}`;

  // cache proxy
  _allNameProxies[nameSetId] = p;

  return p;
}


/**
 * ####################################################################################
 * Build data model
 * ####################################################################################
 */

const dataModelGenerators = {
  /**
   * Add data nodes for one-to-many relationship.
   */
  hasMany(n) {
    // TODO: addAToB
    // TODO: deleteAFromB

    return {
      // the children store ids mutually
      children: {
        [n.aIdsOfBs]: {
          path: n.aIdsOfBs,
          children: {
            [n.aIdsOfB]: {
              path: pathForVar(n.aId),
              reader(res) {
                return res === null ? EmptyObject : res;
              },
              children: {
                [n.aIdOfB]: pathForVar(n.bId)
              }
            }
          }
        }
      },

      readers: {
        [n.asOfB](args, readers) {
          const objs = readers[n.aIdsOfB](args);
          if (objs === NOT_LOADED) {
            return NOT_LOADED;
          }
          return mapValues(
            objs || EmptyObject,
            (_, id) => readers[n.a]({ [n.aId]: id })
          );
        },

        [n.countAsOfB](args, readers) {
          const ids = readers[n.aIdsOfB](args);
          if (ids === NOT_LOADED) {
            return NOT_LOADED;
          }
          return size(ids);
        },

        [n.anyAsOfB](args, readers) {
          const ids = readers[n.aIdsOfB](args);
          if (ids === NOT_LOADED) {
            return NOT_LOADED;
          }
          return size(ids) > 0;
        },

        [n.bIdsWithoutA](args, readers) {
          // WARNING: this doesn't scale well, with large sets of B's
          const getAllBs = readers[n.bList];
          const getAIdsOfB = readers[n.aIdsOfB];
          if (!getAllBs.isLoaded(args)) {
            return NOT_LOADED;
          }

          const bs = getAllBs();
          if (!bs) {
            return EmptyArray;
          }

          const bIds = Object.keys(bs);
          const idArgs = map(bIds, bId => ({ [n.bId]: bId }));
          const isLoaded = getAIdsOfB.areAllLoaded(idArgs);
          if (!isLoaded) {
            return NOT_LOADED;
          }

          // return all Bs that don't have any A
          return filter(idArgs, idArg => !size(getAIdsOfB(idArg)));
        },

        // /**
        //  * Get all a-ids that have at least one b, but are not in the given b [bi-directional relationship]
        //  */
        // uidsOfProjectButNot(
        //   { projectId },
        //   { },
        //   { userProjectIdIndex, userProjectIdIndex_isLoaded, usersPublic, usersPublic_isLoaded }
        // ) {
        //   if (!usersPublic_isLoaded | !userProjectIdIndex_isLoaded) {
        //     return NOT_LOADED;
        //   }

        //   if (!usersPublic) {
        //     return EmptyArray;
        //   }

        //   const uids = Object.keys(usersPublic);
        //   if (!userProjectIdIndex) {
        //     // not a single user is assigned yet
        //     return EmptyArray;
        //   }

        //   // get all uids of users who have at least one project (excluding the given project)
        //   return filter(uids, uid => {
        //     // has projects and is not in given project
        //     return userProjectIdIndex[uid] &&
        //       size(userProjectIdIndex[uid]) > 0 &&
        //       !(userProjectIdIndex[uid][projectId]);
        //     // const excludeSize = (userProjectIdIndex[uid] && userProjectIdIndex[uid][projectId] && 1) || 0;
        //     // return size(userProjectIdIndex[uid]) <= excludeSize;
        //   });
        // },
      }
    };
  }
};


/**
 * ####################################################################################
 * Graph
 * ####################################################################################
 */

class Relationship {
  constructor() {
  }

  _getNameProxyHas(a) {
    const aName = '??';
    const aIdName = '??';

    const { configNode } = treeNode;
    const bName = treeNode.name;
    const {
      pathConfig
    } = configNode;
    const { pathTemplate } = pathConfig;
    const bIdName = getIdNameFromPathTemplate(pathTemplate);

    const bListName = treeNode.parent.name;

    return _getNameProxy(aName, bName, aIdName, bIdName, bListName);
  }
}

/**
 * Any graphNode represents a treeNode with at least one of two types of relationships:
 * 
 * 1) Either: has (owns) one or more other nodes (b of hasMany relationship)
 * 2) Or: belongs to one or more other nodes (a of hasMany relationship)
 * 
 * (...or both)
 */
class GraphNode {
  constructor(graph, treeNode) {
    this.graph = graph;
    this.treeNode = treeNode;

    this.has = [];
    this.belongsTo = [];
  }

  get name() {
    return this.treeNode.name;
  }
}

export class DataRelationshipGraph {
  nodesByName = {};

  hasManyRelationships = [];
  belongsToRelationships = [];
  manyToManyRelationships = [];

  /**
   * ####################################################################################
   * Graph: basic construction
   * ####################################################################################
   */

  constructor(tree) {
    this.tree = tree;

    autoBind(this);
  }

  getNode = (name) => {
    return this.nodesByName[name];
  }

  forEachNode(fn) {
    forEach(this.nodesByName, fn);
  }

  _buildGraph() {
    // build graph of all nodes that have explicit relationships with other nodes
    this.tree.root.forEachNodeInSubTree(this._getOrCreateGraphNodeForTreeNode);

    // actually build the relationships
    this._buildAllRelationships();

    // // after all nodes have been added, directly fix up all related nodes
    // this._completeEdges();
  }
  
  /**
   * ####################################################################################
   * Graph: build nodes
   * ####################################################################################
   */

  _getOrCreateGraphNodeForTreeNode = (treeNode) => {
    let graphNode = this.getNode(treeNode.name);
    if (!graphNode) {
      // not added yet
      const { configNode } = treeNode;

      const {
        hasMany,
        relationship
      } = configNode;

      if (hasMany || relationship) {
        if (!treeNode.parent) {
          throw new Error('Cannot add relationship to root node');
        }

        graphNode = new GraphNode(this, treeNode);
        this._addNode(graphNode);
      }
    }
    return graphNode;
  }

  _addNode(node) {
    this.nodesByName[node.name] = node;
  }


  /**
   * ####################################################################################
   * Graph: build relationships
   * ####################################################################################
   */

  _buildAllRelationships() {
    const relationshipDataConfig = this.relationshipDataConfig = {
      path: '_rel'
    };

    // TODO

    // 1. collect + handle all hasMany relationships
    // 2. collect + handle all many-to-many relationships
    // 3. clean up all relationships of any node when deleting (owning and owned!)
    this.forEachNode(this._addHasMany);
  }

  _addHasMany(graphNode) {
    const { treeNode } = graphNode;
    const { configNode } = treeNode;
    let {
      hasMany,
      relationship
    } = configNode;

    hasMany = hasMany || relationship && relationship.hasMany;

    const bName = graphNode.name;

    const aName = isString(hasMany) ? hasMany : hasMany.name;
    const aTreeNode = this.tree.root.getReadDescendantByName(aName);
    if (!aTreeNode) {
      throw new Error(`invalid "hasMany" relationship in ${bName} - ${aName} does not exist in data (sub-)tree`);
    }
    const aGraphNode = this._getOrCreateGraphNodeForTreeNode(treeNode);
  }

  /**
   * b has many a
   */
  addHasManyRelation(aName, bName) {
    const cfg = dataModelGenerators.hasMany(n);

    // TODO
  }

  /**
   * a has many b, AND b has many a
   */
  addManyToManyRelation(aName, bName) {

    // index name combines the two names.
    // to make sure it's the same in both directions, we need to sort the two in some universal order
    const indexName = [aName, bName].sort().join('_') + 'm2m';
    const path = indexName;
    // this.addHasManyRelation(aName, bName);
    // this.addHasManyRelation(bName, aName);

    // get all a-ids that have at least one b, but are not connected to given b (and vice versa!)
    // connect a to b: add a to b, and b to a
    // disconnect a and b: remove a from b, and b from a
  }

  /**
   * 
   */
  _addCleanup(aName) {
    // TODO

    // when deleting any node:
    //    1. delete all owned references
    //    2. delete all it's references from all owners
  }

  // _completeEdges() {
  //   forEach(this.nodesByName, node => {
  //     node.edges = map(node.edgeNames, this.getNode);
  //   });
  // }
}

export function DataRelationshipPlugin(tree) {
  const graph = new DataRelationshipGraph(tree);
  graph._buildGraph();

  // when finished building, add to tree!
  tree.addChildToRoot(graph.relationshipDataConfig);

  return graph;
}



/**
 * ####################################################################################
 * Old examples
 * ####################################################################################
 */


// examples of a-hasMany-b relationship:

// a = project
// b = user
const readers = {
  /**
   * Cut all ties of B with all of it's A's
   */
  m2mDisconnectBUpdates(
    args,
    { uidsOfProject, projectOfUser }
  ) {
    const { projectId } = args;
    const projectArgs = { projectId };

    if (!uidsOfProject.isLoaded(projectArgs)) {
      return NOT_LOADED;
    }

    const uids = Object.keys(uidsOfProject(projectArgs) || EmptyObject);

    const updates = getOptionalArgument(args, 'updates', {});

    // delete b from all it's a
    Object.assign(updates, zipObject(
      map(uids, uid => projectOfUser.getPath({ uid, projectId })),
      times(uids.length, () => null)
    ));

    // delete all a of this b
    updates[uidsOfProject.getPath(projectArgs)] = null;

    return updates;
  }
};



const writers = {
  connectUserProject(
    { uid, projectId },
    { uidOfProject, projectIdOfUser },
    { },
    { updateAll }) {
    return updateAll({
      pathArgs: { uid, projectId },
      readers: [uidOfProject, projectIdOfUser],
      val: 1
    });
  },

  disconnectUserProject(
    { uid, projectId },
    { uidOfProject, projectIdOfUser },
    { },
    { updateAll }) {
    return updateAll({
      pathArgs: { uid, projectId },
      readers: [uidOfProject, projectIdOfUser],
      val: null
    });
  },

  deleteB(
    args,
    { m2mDisconnectBUpdates, projectById },
    { },
    { update_db }
  ) {
    const { projectId } = args;
    const projectArgs = { projectId };

    let updates = m2mDisconnectBUpdates(args);

    // actually delete b
    updates[projectById.getPath(projectArgs)] = null;

    // merge in further updates that atomically need to succeed to make the deletion work
    const moreUpdates = getOptionalArgument(args, 'moreUpdates');
    if (moreUpdates) {
      updates = Object.assign(updates, moreUpdates);
    }
    return update_db(updates);
  },
};
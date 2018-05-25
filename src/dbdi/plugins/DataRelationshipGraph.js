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
import isPlainObject from 'lodash/isPlainObject';
import isArray from 'lodash/isArray';
import zipObject from 'lodash/zipObject';
import times from 'lodash/times';
import uniq from 'lodash/uniq';

import pluralize from 'pluralize';

import autoBind from 'src/util/auto-bind';

import { EmptyObject, EmptyArray } from '../../util';

import { NOT_LOADED } from 'src/dbdi';
import { getOptionalArgument } from 'src/dbdi/dataAccessUtil';
import { getFirstVariableInPathTemplate } from 'src/dbdi/PathUtil';

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
  asOfB: (n) => `${n.as}Of${n.B}`, // (e.g. usersOfProject)
  aIdsOfBs: (n) => `${n.aIds}Of${n.Bs}`, // (e.g. uidsOfProjects)
  aIdsOfB: (n) => `${n.aIds}Of${n.B}`, // (e.g. uidsOfProject)
  aIdOfB: (n) => `${n.aId}Of${n.B}`, // (e.g. uidOfProject)
  countAsOfB: (n) => `count${n.As}Of${n.B}`, // (e.g. countUsersOfProject)
  anyAsOfB: (n) => `any${n.As}Of${n.Bs}`, // (e.g. anyUsersOfProject)
  bIdsWithoutA: (n) => `${n.bIds}Without${n.A}`, // (e.g. projectIdsWithoutUser)

  addAToB: n => `add${n.A}To${n.B}`,
  deleteAFromB: n => `delete${n.A}From${n.B}`,
  deleteAllAsFromB: n => `deleteAll${n.As}From${n.B}`,
  deleteB: n => `delete${n.B}`,
  update_aIdOfB: (n) => `update_${n.aIdOfB}`,
  update_aIdsOfB: (n) => `update_${n.aIdsOfB}`,
  update_aIdsOfBs: (n) => `update_${n.aIdsOfBs}`
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

/**
 * Generate names.
 */
function getNameProxy(...allNames) {
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

function getRelationshipName(aName, bName) {
  return [aName, bName].sort().join('_');
}


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
 * ####################################################################################
 * Build data model
 * ####################################################################################
 */

/** 
 * Batch multiple write operations into a single update operation.
 * Will maintain an optional argument '_batchedUpdates', which carries the
 * wanted updates through any amount of write operations.
 * The given `generateUpdates` callback is an asynchronous call; once
 * it returns at the top level, will commit all updates to DB.
 * 
 * TODO: does not currently work when using paths of different dataProviders.
 */
async function batchUpdate(args, writers, generateUpdates) {
  let _batchedUpdates = getOptionalArgument(args, '_batchedUpdates');
  const isFirstOnStack = !_batchedUpdates;
  if (isFirstOnStack) {
    // inject new _batchedUpdates object
    _batchedUpdates = {};
    args = { ...args, _batchedUpdates };
  }

  // collect updates (possibly recursively)
  const newUpdates = await generateUpdates(args);
  Object.assign(_batchedUpdates, newUpdates);

  if (isFirstOnStack) {
    // actually send out the updates
    return await writers.update_db(_batchedUpdates);
  }
  return _batchedUpdates;
}

/**
 * The config generated from this is added to any hasMany relationship.
 * Many2many relationships will add these once for each direction.
 */
const basicDataModelGenerators = {
  hasMany(n) {
    return {
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
          // WARNING: this doesn't scale well once there are many B's

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
          const emptyIdArgs = filter(idArgs, idArg => !size(getAIdsOfB(idArg)));
          return map(emptyIdArgs, idArg => idArg[n.bId]);
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
 * Some data access (especially delete calls) have 
 * different implementation, depending on the relationship type.
 * 
 * Any relationship will only add one of these.
 */
const specializedDataModelGenerators = {
  /**
   * Only one-to-many relationships have these data model nodes
   */
  oneToMany(n, cfg) {
    return {
      children: {
      },
      readers: {
      },
      writers: {
        async [n.addAToB](args, readers, injected, writers) {
          return await batchUpdate(args, writers, async (args) => {
            return {
              [readers[n.aIdOfB].getPath(args)]: 1
            };
          });
        },

        async [n.deleteAFromB](args, readers, injected, writers) {
          return await batchUpdate(args, writers, async (args) => {
            return {
              [readers[n.aIdOfB].getPath(args)]: null
            };
          });
        },

        async [n.deleteAllAsFromB](args, readers, injected, writers) {
          return await batchUpdate(args, writers, async (args) => {
            throw new Error('NYI');
            // TODO!
            // return {
            //   [readers[n.aIdOfB].getPath(args)]: null
            // };
          });
        },

        // handles the "b hasMany a" case
        async [n.deleteB](args, readers, injected, writers) {
          return await batchUpdate(args, writers, async (args) => {
            const updates = {};
            if (cfg.aBelongsToB) {
              const aIds = await readers[n.aIdsOfB].readAsync(args) || EmptyObject;

              // delete all a's that belong to given b
              Object.assign(updates, zipObject(
                map(aIds, aId => readers[n.a].getPath({
                  ...args,
                  [n.aId]: aId
                })),
                times(aIds.length, () => null)
              ));
            }

            // remove all a's from this b
            updates[readers[n.aIdsOfB].getPath(args)] = null;

            // finally, actually delete b
            updates[readers[n.b].getPath(args)] = null;

            return updates;
          });
        }
      }
    };
  },

  /**
   * Only many-to-many relationships have these data model nodes.
   * 
   * @param {*} n1 Names for b-hasMany-a relationship
   * @param {*} n2 Names for a-hasMany-b relationship (effectively reversing meaning of a + b)
   */
  manyToMany(n1, n2, cfg) {
    const genDeleteB = ((n1, n2) => {
      return async function (args, readers, injected, writers) {
        const aIds = await readers[n1.aIdsOfB].readAsync(args) || EmptyObject;

        return await batchUpdate(args, writers, async (args) => {
          // remove b from all it's a's
          const updates = zipObject(
            map(aIds, aId => readers[n2.aIdOfB].getPath({
              ...args,
              [n1.aId]: aId
            })),
            times(aIds.length, () => null)
          );

          // remove all a's from this b
          updates[readers[n1.aIdsOfB].getPath(args)] = null;

          // finally, actually delete b
          updates[readers[n1.b].getPath(args)] = null;
        });
      };
    })();
    return {
      children: {
      },
      readers: {
      },
      writers: {
        /**
         * NOTE: This is a bi-directional, homogeneous operation. It is the same for either a or b.
         */
        async [n1.connectAB](args, readers, injected, writers) {
          return await batchUpdate(args, writers, async (args) => {
            // add a to b and b to a
            return {
              [readers[n1.aIdOfB].getPath(args)]: 1,
              [readers[n2.aIdOfB].getPath(args)]: 1
            };
          });
        },

        /**
         * NOTE: This is a bi-directional, homogeneous operation. It is the same for either a or b.
         */
        async [n1.disconnectAB](args, readers, injected, writers) {
          return await batchUpdate(args, writers, async (args) => {
            // remove a of b and b of a
            return {
              [readers[n1.aIdOfB].getPath(args)]: null,
              [readers[n2.aIdOfB].getPath(args)]: null
            };
          });
        },

        // delete b and remove all relationship edges to and from it
        [n1.deleteB]: genDeleteB(n1, n2),

        // delete a and remove all relationship edges to and from it
        [n1.deleteA]: genDeleteB(n2, n1)
      }
    };
  }
};

/**
 * ####################################################################################
 * Parse hasMany configuration
 * ####################################################################################
 */

function _sanitizeHasManyConfigEntry(hasMany) {
  if (isString(hasMany)) {
    return { name: hasMany };
  }
  if (isPlainObject(hasMany)) {
    if (!hasMany.name) {
      throw new Error(`invalid hasMany configuration entry does not have a name - ${JSON.stringify(hasMany)}`);
    }
    return hasMany;
  }
  throw new Error(`invalid hasMany configuration entry must be string or plain object - ${JSON.stringify(hasMany)}`);
}

function parseHasManyConfig(hasMany) {
  if (isString(hasMany) || isPlainObject(hasMany)) {
    // one single entry
    const entry = _sanitizeHasManyConfigEntry(hasMany);
    return { [entry.name]: entry };
  }
  if (isArray(hasMany)) {
    // a bunch of entries
    const entries = map(hasMany, _sanitizeHasManyConfigEntry);
    return zipObject(map(entries, 'name'), entries);
  }
  throw new Error(`invalid hasMany configuration must be a single string or plain object, or an array thereof - ${JSON.stringify(hasMany)}`);
}

/**
 * ####################################################################################
 * Graph: Relationships
 * ####################################################################################
 */

/**
 * Relationships represent uni-directional and bi-directional edges in the Graph.
 */
class Relationship {
  a;
  b;
  cfg;
  constructor(a, b, cfg) {
    this.a = a;
    this.b = b;
    this.cfg = cfg;
  }

  buildConfigEntry() {
    // all relationship implement a function to build their config entry
  }

  get relationshipName() {
    return getRelationshipName(this.a.name, this.b.name);
  }
}

/**
 * Base-line "hasMany" relationship, could be one-to-many or
 * part of a many-to-many.
 */
class BHasManyARelationship extends Relationship {
  constructor(a, b, cfg) {
    super(a, b, cfg);

    b.hasMany.push(this);
  }

  buildConfigEntry() {
    const n = getNameProxy();
    return basicDataModelGenerators.hasMany(n, this.cfg);
  }

  getNameProxy() {
    const { a, b } = this;
    const aName = a.name;
    const bName = b.name;
    const aIdName = a.idName;
    const bIdName = b.idName;
    const bListName = b.listName;
    return getNameProxy(aName, bName, aIdName, bIdName, bListName);
  }
}

// class ABelongsToBRelationship extends Relationship {
//   constructor(parentCfgNode, a, b) {
//     super(parentCfgNode, a, b);

//     a.belongsTo.push(this);
//   }
// }

/**
 * Unidirectional relationship: simply encapsulates a single hasMany relationship.
 * Has specialized data model that is different from m2m relationship.
 */
class OneToManyRelationship extends Relationship {
  constructor(hasMany) {
    super(hasMany.a, hasMany.b, hasMany.cfg);

    this.hasMany = hasMany;
  }

  buildConfigEntry() {
    const n = this.hasMany.getNameProxy();

    return Object.assign({},
      this.hasMany.buildConfigEntry(),
      specializedDataModelGenerators.oneToMany(n, this.cfg)
    );
  }
}

/**
 * Bidirectional relationship: Built from two hasMany relationships.
 */
class ManyToManyRelationship extends Relationship {
  constructor(bHasManyA, aHasManyB) {
    //super(bHasManyA, aHasManyB);
    const { a, b } = bHasManyA;
    super(a, b);

    this.bHasManyA = bHasManyA;
    this.aHasManyB = aHasManyB;
  }

  buildConfigEntry() {
    const n1 = this.bHasManyA.getNameProxy();
    const n2 = this.aHasManyB.getNameProxy();

    return Object.assign({},
      this.bHasManyA.buildConfigEntry(),
      this.aHasManyB.buildConfigEntry(),
      specializedDataModelGenerators.manyToMany(n1, n2, this.cfg)
    );
  }

}

/**
 * ####################################################################################
 * Graph: GraphNode
 * ####################################################################################
 */

/**
 * GraphNodes wrap treeNodes,
 * specifically any treeNode with at least one of two types of relationships:
 * 
 * 1) Either: has (owns) one or more other nodes (b of hasMany relationship)
 * 2) Or: belongs to one or more other nodes (a of hasMany relationship)
 * 3) Or: both (many-to-many)
 */
class GraphNode {
  // relationships
  hasMany = [];
  //belongsTo = [];

  // settings
  hasManyCfg;

  constructor(graph, treeNode) {
    this.graph = graph;
    this.treeNode = treeNode;

    const { cfg: configNode } = treeNode;
    const { hasMany } = configNode;

    // parse hasMany config
    this.hasManyCfg = this.parseHasManyConfig(hasMany);
  }

  doesHaveMany(aName) {
    return !!this.hasManyCfg[aName];
  }

  get name() {
    return this.treeNode.name;
  }

  get idName() {
    const { cfg: configNode } = this.treeNode;
    const {
      pathConfig
    } = configNode;
    const { pathTemplate } = pathConfig;

    return getIdNameFromPathTemplate(pathTemplate);
  }

  get listName() {
    return this.treeNode.parent.name;
  }
}


export class DataRelationshipGraph {
  nodesByName = {};

  hasManyRelationships = [];

  // stored by name, since they are only inserted once, no matter if uni- or bi-directional
  specializedRelationships = {};

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
      const { cfg: configNode } = treeNode;

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
    this.relationshipDataConfig = {
      _relationships: {
        path: '_rel',
        children: {}
      }
    };

    // build graph
    this.forEachNode(this._addRelationshipsForNode);

    // categorize all relationships into one-to-many and many-to-many
    this.categorizeEdges();

    // generate config
    this.buildRelationshipConfig();
  }

  _getConfigNode(relationshipName) {
    return this.relationshipDataConfig.children[relationshipName];
  }

  /**
   * Gets (creates if necessary) empty node containing the data model for the relationship
   */
  _getOrCreateConfigNodeForRelationship(rel) {
    const { a, b } = rel;
    const relationshipName = getRelationshipName(a.Name, b.Name);
    let node = this._getConfigNode(relationshipName);
    if (!node) {
      node = this.relationshipDataConfig.children[relationshipName] = {};
    }
    return node;
  }

  _addRelationshipsForNode(bGraphNode) {
    const { treeNode: bTreeNode } = bGraphNode;
    const bName = bGraphNode.name;

    forEach(bGraphNode.hasManyCfg, (hasManyEntry, aName) => {
      const aTreeNode = this.tree.root.getReadDescendantByName(aName);
      if (!aTreeNode) {
        throw new Error(`invalid "hasMany" relationship in ${bName}: ${aName} does not exist in data (sub-)tree`);
      }
      if (!aTreeNode.isWriter || !aTreeNode.isReader) {
        throw new Error(`invalid "hasMany" relationship in ${bName}: ${aName} must be (but is not) readable and writable`);
      }
      const aGraphNode = this._getOrCreateGraphNodeForTreeNode(aTreeNode);

      // add hasMany relationship
      this.addHasManyRelation(aGraphNode, bGraphNode);
    });

    // TODO: belongsTo relationships
  }

  categorizeEdges() {
    // TODO: categorize and add one-to-many + many-to-many relationship entries
    this.hasManyRelationships.forEach(hasMany => {
      // TODO!
      if (hasMany.a.) {
        // only goes in one direction
        new OneToManyRelationship(hasMany);
      }
      else if (!specializedRelationships[hasMany.relationshipName]) {
        // found first node of an m2m relationship
        new ManyToManyRelationship();
      }
      else {
        // nothing to do! (second node of an m2m relationship)
      }
    });
  }

  _addRelationship(rel) {
    this.hasManyRelationships.push(rel);
  }

  /**
   * Add relationship to cfgNode
   */
  addHasManyRelation(a, b) {
    this._addRelationship(new BHasManyARelationship(a, b));
    //this._addRelationship(new ABelongsToBRelationship(cfgNode, a, b));
  }

  /**
   * a has many b, AND b has many a
   */
  addManyToManyRelation(a, b) {

  }

  buildRelationshipConfig() {
    this.hasManyRelationships.forEach(rel => {
      const cfgNode = this._getOrCreateConfigNodeForRelationship(rel);

      // TODO
    });
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
  console.warn(graph.relationshipDataConfig);
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
};
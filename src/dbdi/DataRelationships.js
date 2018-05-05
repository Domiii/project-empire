import size from 'lodash/size';
import filter from 'lodash/filter';
import every from 'lodash/every';
import forEach from 'lodash/forEach';
import map from 'lodash/map';
import zipObject from 'lodash/zipObject';
import times from 'lodash/times';

import pluralize from 'pluralize';

import { EmptyObject, EmptyArray } from '../../util';
import { NOT_LOADED } from '../react';
import { getOptionalArgument } from '../dataAccessUtil';
import { getFirstVariableInPathTemplate } from './PathUtil';

const validNameRe = /[a-z_$][0-9a-zA-Z_$]*/;

/**
 * many2many indexing (only working for Firebase-style data organization for now)
 */

function getIdFromPathTemplate(pathTemplate) {

}

class NodeRelationshipConfig {
  constructor(cfg) {
    let name;
    if (isString(cfg)) {
      name = cfg;
    }
    else {
      name = cfg.name;
    }
    if (!validNameRe.test(name)) {
      throw new Error('must use lower-case ');
    }

    // TODO: names + name constraints
      // singular vs. plural
      // lower case vs. title case
      // id names
      // all names must be unique/different from one another?

    this.name = name;
  }
}

class GraphNode {
  constructor(name, idName, ) {
    this.edgeNames = [];
  }
}

class Graph {
  nodesByName = {};

  getNode = (name) => {
    return this.nodesByName[name];
  }

  addNode() {
    // TODO
  }

  _completeEdges() {
    forEach(this.nodesByName, node => {
      node.edges = map(node.edgeNames, this.getNode);
    });
  }
}

export class DataRelationships {
  constructor(tree, treeConfig) {
    this.tree = tree;
    this.treeConfig = treeConfig;

    this.graph = this._buildGraph();
  }

  _buildGraph() {
    const graph = new Graph();

    // TODO: run through treeConfig, identify and build relationships


    // after all nodes have been added, directly fix up all related nodes
    graph._completeEdges();

    return graph;
  }

  _addToGraph(configNode, treeNode) {
    const {
      hasMany,
      path
    } = configNode;

    if (hasMany) {
      const { pathTemplate } = configNode.pathConfig;
      const idName = getFirstVariableInPathTemplate(pathTemplate);
      if (!idName) {
        throw new Error(`Node with 'hasMany' relationship missing variable in path: '${pathTemplate}'`);
      }

      // TODO
      const newNode = new GraphNode();

      // TODO
      this.graph.addNode(newNode);
    }
  }

  /**
   * a has many b
   */
  addHasManyRelation(aName, bName) {
    // TODO: add all kinds of readers + writers for properly managing the new relation
    // get b ids of a
    // get b entries of a
    // count b's of a
    // has a any b
    // get all a that don't have any b

    usersOfProject({ projectId }, { uidsOfProject, userPublic }, { }) {
      return mapValues(
        uidsOfProject({ projectId }) || EmptyObject,
        (_, uid) => userPublic({ uid })
      );
    },
  
    // count-bs-of-a
    countUsersOfProject({ projectId }, { uidsOfProject }) {
      const uids = uidsOfProject({ projectId });
      if (uids === NOT_LOADED) {
        return NOT_LOADED;
      }
      return size(uids);
    },
  }

  /**
   * a has many b, AND b has many a
   */
  addManyToManyRelation(aName, bName) {
    this.addHasManyRelation(aName, bName);
    this.addHasManyRelation(bName, aName);

    // get all a-ids that have at least one b, but are not connected to given b
    // connect a to b: add a to b, and b to a
    // disconnect a and b: remove a from b, and b from a
  }

  /**
   * a has any kind of ownership relationships
   * (which *ALL* need to be disentangled when deleting any a)
   */
  addDeleters(aName) {
    // delete all it's associated indices when deleting any a
  }
}

function buildChildren() {
  return {
    projectUidIndex: {
      path: '/_index/projectUsers/project',
      children: {
        uidsOfProject: {
          path: '$(projectId)',
          reader(res) {
            return res === null ? EmptyObject : res;
          },
          children: {
            uidOfProject: '$(uid)'
          }
        }
      }
    },
    userProjectIdIndex: {
      path: '/_index/projectUsers/user',
      children: {
        projectIdsOfUser: {
          path: '$(uid)',
          reader(res) {
            return res === null ? EmptyObject : res;
          },
          children: {
            projectIdOfUser: '$(projectId)'
          }
        }
      }
    }
  };
}


// examples of a-hasMany-b relationship:

// a = project
// b = user
const readers = {
  // bs-of-a
  usersOfProject({ projectId }, { uidsOfProject, userPublic }, { }) {
    return mapValues(
      uidsOfProject({ projectId }) || EmptyObject,
      (_, uid) => userPublic({ uid })
    );
  },

  // count-bs-of-a
  countUsersOfProject({ projectId }, { uidsOfProject }) {
    const uids = uidsOfProject({ projectId });
    if (uids === NOT_LOADED) {
      return NOT_LOADED;
    }
    return size(uids);
  },

  // bIds-without-any-a (WARNING: this is an example of b-hasMany-a; a-hasMany-b would be projectIdsWithoutUser)
  uidsWithoutProject(
    { },
    { },
    { userProjectIdIndex, userProjectIdIndex_isLoaded, usersPublic, usersPublic_isLoaded }
  ) {
    // TODO: make this more efficient (achieve O(k), where k = users without project)
    if (!usersPublic_isLoaded | !userProjectIdIndex_isLoaded) {
      return NOT_LOADED;
    }

    if (!usersPublic) {
      return null;
    }

    const uids = Object.keys(usersPublic);
    if (!userProjectIdIndex) {
      // not a single user is assigned yet
      return uids;
    }

    // get all uids of users who have no project yet
    return filter(uids, uid => !size(userProjectIdIndex[uid]));
  },

  /**
   * Get all a-ids that have at least one b, but are not in the given b [bi-directional relationship]
   */
  uidsOfProjectButNot(
    { projectId },
    { },
    { userProjectIdIndex, userProjectIdIndex_isLoaded, usersPublic, usersPublic_isLoaded }
  ) {
    if (!usersPublic_isLoaded | !userProjectIdIndex_isLoaded) {
      return NOT_LOADED;
    }

    if (!usersPublic) {
      return EmptyArray;
    }

    const uids = Object.keys(usersPublic);
    if (!userProjectIdIndex) {
      // not a single user is assigned yet
      return EmptyArray;
    }

    // get all uids of users who have at least one project (excluding the given project)
    return filter(uids, uid => {
      // has projects and is not in given project
      return userProjectIdIndex[uid] &&
        size(userProjectIdIndex[uid]) > 0 &&
        !(userProjectIdIndex[uid][projectId]);
      // const excludeSize = (userProjectIdIndex[uid] && userProjectIdIndex[uid][projectId] && 1) || 0;
      // return size(userProjectIdIndex[uid]) <= excludeSize;
    });
  },

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
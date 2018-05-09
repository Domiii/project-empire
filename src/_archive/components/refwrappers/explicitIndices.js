import map from 'lodash/map';
import filter from 'lodash/filter';
import mapValues from 'lodash/mapValues';
import isString from 'lodash/isString';
import isArray from 'lodash/isArray';
import isEqual from 'lodash/isEqual';
import isEmpty from 'lodash/isEmpty';
import pickBy from 'lodash/pickBy';
import forEach from 'lodash/forEach';
import flatten from 'lodash/flatten';
import uniq from 'lodash/uniq';

import autoBind from 'src/util/auto-bind';

import { pathJoin } from 'src/util/pathUtil';
import { EmptyObject, EmptyArray } from 'src/util';

import { 
  makeRefWrapper,
  addChildrenToRefWrapper
} from './RefWrapper';

const staticConfig = {
  indexRoot: '/_index'
};

/**
 * ========================
 * Usage Steps
 * ========================
 * 1. make queries on page level
 * 2. create index ref object in @connect on list level
 * 3. access dependent refs from index ref
 *
 */


export function m2mIndex(
    indexName, 
    leftName, rightName, 
    LeftEntryRef, RightEntryRef,
    
    members) {
  const IndexRef = addM2MIndexRef(indexName, leftName, rightName);
  const f = (firebaseRoot, leftEntryRefArgs, rightEntryRefArgs) => {
    const leftEntryRef = LeftEntryRef(firebaseRoot, leftEntryRefArgs);
    const rightEntryRef = RightEntryRef(firebaseRoot, rightEntryRefArgs);
    return new M2MExplicitIndex(f, indexName, leftName, rightName,
      leftEntryRef, rightEntryRef, IndexRef, LeftEntryRef, RightEntryRef, members);
  };
  f.IndexRef = IndexRef;

  Object.assign(f, {
    _addQuery(queryArr, basePath, id) {
      if (isArray(id)) {
        for (var i = 0; i < id.length; ++i) {
          queryArr.push(pathJoin(basePath, id[i]));
        }
      }
      else if (!isEmpty(id)) {
        queryArr.push(pathJoin(basePath, id));
      }
      else {
        queryArr.push(basePath);
      }
    },

    // TODO: Make this work properly, once rrf performance issues are under control
    addIndexQueries(queryArr, queryArgs) {
      const leftQueryArgs = queryArgs && queryArgs[leftName];
      const rightQueryArgs = queryArgs && queryArgs[rightName];
      const hasFilter = !isEmpty(leftQueryArgs) || !isEmpty(rightQueryArgs);

      // for now, we just assume that query args are arrays of ids we are interested in
      // if (hasFilter) {
      //   if (!isEmpty(leftQueryArgs)) {
      //     if (!isArray(leftQueryArgs)) {
      //       throw new Error('Currently, only arrays are supported for arguments to `addIndexQueries`');
      //     }

      //     leftQueryArgs.forEach(id => 
      //       queryArr.push(
      //         IndexRef[leftName].leftEntry.makeQuery({leftId: id}),
      //         IndexRef[rightName].makeQuery(
      //           `orderByChild=${id}`,
      //           `equalTo=${1}`
      //         )
      //       )
      //     );
      //   }
      //   if (!isEmpty(rightQueryArgs)) {
      //     if (!isArray(rightQueryArgs)) {
      //       throw new Error('Currently, only arrays are supported for arguments to `addIndexQueries`');
      //     }

      //     rightQueryArgs.forEach(id => 
      //       queryArr.push(
      //         IndexRef[rightName].rightEntry.makeQuery({rightId: id}),
      //         IndexRef[leftName].makeQuery(
      //           `orderByChild=${id}`,
      //           `equalTo=${1}`
      //         )
      //       )
      //     );
      //   }
      // }
      // else 
      {
        // in case, there are no args, get everything
        queryArr.push(IndexRef[leftName].makeQuery());
        queryArr.push(IndexRef[rightName].makeQuery());
      }

      // const newFilter = { leftId, rightId };
      // //if (this.filter) {
      //   // if (!isEqual(this.filter, newFilter)) {
      //   //   throw new Error('tried to initialize same index with different configurations');
      //   // }
      //   this.filter = newFilter;
      // //}

      // const leftPath = ;
      // const rightPath = ;

      // if (!isEmpty(leftId)) {
      //   this._addQuery(queryArr, leftPath, leftId);
      // }
      // else {
      //   this._addQuery(queryArr, leftPath);
      // }

      // if (!isEmpty(rightId)) {
      //   this._addQuery(queryArr, rightPath, rightId);
      // }
      // else {
      //   this._addQuery(queryArr, rightPath);
      // }
    }
  });

  return f;
}

function sanitizeExplicitIndexConfig(cfg) {
  if (!isString(cfg.pathName)) {
    throw new Error('invalid explicitIndex: ' +
      JSON.stringify(cfg, null, 2));
  }
}


class BaseExplicitIndex {
  // constructor(indexName, keyName, ref) {
  //   // name of the index
  //   this.indexName = indexName;

  //   // name of the key under which the index information is stored in ref objects
  //   this.baseKeyName = baseKeyName;

  //   // the ref object wrapping the firebase path
  //   this.ref = ref;
  // }

  // getExplicitIndexPath() {
  //   const {
  //     indexName, ref
  //   } = this;
  //   let indexPath = pathJoin(staticConfig.indexRoot, ref.path);
  //   indexPath = pathJoin(indexPath, indexName);
  //   return indexPath;
  // }

  // // queries the entire reference path + index, and 
  // //    validates index integrity
  // // returns a promise which eventually returns a set
  // //    of inconsistencies (if any)
  // validateIndex() {

  // }

  // // used to rebuild given index
  // //  (e.g. when it's new, broken or structurally modified)
  // buildIndex() {

  // }
}


const m2mExplicitIndexRef = makeRefWrapper({
  pathTemplate: staticConfig.indexRoot
});


function addM2MIndexRef(indexName, leftName, rightName) {
  addChildrenToRefWrapper(m2mExplicitIndexRef, {
    [indexName]: {
      pathTemplate: indexName,

      children: {
        [leftName]: {
          pathTemplate: leftName,

          children: {
            leftEntry: {
              pathTemplate: '$(leftId)'
            }
          }
        },

        [rightName]: {
          pathTemplate: rightName,

          children: {
            rightEntry: {
              pathTemplate: '$(rightId)'

              // children: {
              //   righToLeft pathTemplate:
              // }
            }
          }
        }
      }
    }
  });

  return m2mExplicitIndexRef[indexName];
}

/**
 * Many-to-many explicit index.
 * Structure layout:
 *  _index.<m2mindexName>.<leftName> -> <leftId>: <rightIds>*
 *  _index.<m2mindexName>.<rightName> -> <rightId>: <leftIds>*
 *
 * Note: the "left" index maps "left ids" to "right data"
 *    This means that if your left index is "user",
 *    and the right is "group", then the left index stores
 *    userId -> { groupIds }, and vice versa.
 */
class M2MExplicitIndex {
  constructor(
      RefWrapperCreator,
      indexName, 
      leftName, rightName, 
      leftEntryRef, rightEntryRef,

      IndexRef,
      LeftEntryRef, RightEntryRef,

      members
    ) {
    this.RefWrapperCreator = RefWrapperCreator;
    this.indexName = indexName;
    this.leftEntryRef = leftEntryRef;
    this.rightEntryRef = rightEntryRef;
    this.LeftEntryRef = LeftEntryRef;
    this.RightEntryRef = RightEntryRef;

    this.leftName = leftName;
    this.rightName = rightName;

    this._firebaseState = leftEntryRef._firebaseState;

    Object.assign(this, members);

    this.IndexRef = IndexRef;
    this.leftIndexRef = IndexRef[leftName](this._firebaseState);
    this.rightIndexRef = IndexRef[rightName](this._firebaseState);

    this.indexRefs = {
      [leftName]: this.leftIndexRef,
      [rightName]: this.rightIndexRef
    };

    this.refs = {
      [leftName]: leftEntryRef,
      [rightName]: rightEntryRef
    };

    autoBind(this);

    this[`get_${leftName}_by_${rightName}`] = this.getLeftEntriesByRightId;
    this[`get_${rightName})_by_${rightName}`] = this.getRightEntriesByLeftId;
    this[`findUnassigned_${leftName}_ids`] = this.findUnassignedLeftIds;
    this[`findUnassigned_${leftName}_entries`] = this.findUnassignedLeftEntries;
    this[`findUnassigned_${rightName}_ids`] = this.findUnassignedRightIds;
    this[`findUnassigned_${rightName}_entries`] = this.findUnassignedRightEntries;
  }

  addLeftDataQuery(queryArr, leftIds) {
    if (isEmpty(leftIds)) {
      return EmptyArray;
    }    


    const rightIds = this.getRightIdsByLeftId(leftIds);
    if (rightIds) {
      const rightIdsArr = flatten(map(Object.values(rightIds), 
        ids => ids && Object.keys(ids) || EmptyArray));
      forEach(uniq(rightIdsArr), 
        id => queryArr.push(pathJoin(this.RightEntryRef.pathTemplate, id)));
      return rightIdsArr;
    }
    return EmptyArray;
  }

  addRightDataQuery(queryArr, rightIds) {
    if (isEmpty(rightIds)) {
      return EmptyArray;
    }

    const leftIds = this.getLeftIdsByRightId(rightIds);
    if (leftIds) {
      const leftIdsArr = flatten(map(Object.values(leftIds), 
        ids => ids && Object.keys(ids) || EmptyArray));
      forEach(uniq(leftIdsArr), 
        id => queryArr.push(pathJoin(this.LeftEntryRef.pathTemplate, id)));
      return leftIdsArr;
    }
    return EmptyArray;
  }

  addDataQueries(queryArr, queryArgs) {
    const { 
      RefWrapperCreator,
      leftName,
      rightName
    } = this;

    // first: add index query
    RefWrapperCreator.addIndexQueries(queryArr, queryArgs);

    // then: add actual data query
    const leftQueryArgs = queryArgs && queryArgs[leftName];
    const rightQueryArgs = queryArgs && queryArgs[rightName];
    const hasFilter = !isEmpty(leftQueryArgs) || !isEmpty(rightQueryArgs);

    if (hasFilter) {
      if (!isEmpty(leftQueryArgs)) {
        // add queries for all left ids
        const rightIds = this.addRightDataQuery(queryArr, leftQueryArgs);

        // also get all related data
        this.addRightDataQuery(queryArr, rightIds);
      }
      if (!isEmpty(rightQueryArgs)) {
        // add queries for all right ids
        const leftIds = this.addLeftDataQuery(queryArr, rightQueryArgs);

        // also get all related data
        this.addLeftDataQuery(queryArr, leftIds);
      }
    }
    else {
      // unfiltered -> get all data
      queryArr.push(this.LeftEntryRef.makeQuery());
      queryArr.push(this.RightEntryRef.makeQuery());
    }

  }

  findUnassignedLeftIds() {
    const leftIndexData = this.leftIndexRef.val;
    const leftData = this.leftEntryRef.val;

    if (!leftData) {
      return EmptyArray;
    }

    if (!leftIndexData) {
      // no object indexed yet
      return Object.keys(leftData);
    }

    return Object.keys(leftData).filter(leftId =>
      isEmpty(leftIndexData[leftId]));
  }

  findUnassignedLeftEntries() {
    const leftIndexData = this.leftIndexRef.val;
    const leftData = this.leftEntryRef.val;
    const leftName = this.leftName;

    if (!leftData) {
      return EmptyObject;
    }

    if (!leftIndexData) {
      // no object indexed yet
      return leftData;
    }

    return pickBy(leftData, (leftData, leftId) =>
      isEmpty(leftIndexData[leftId]));
  }

  findUnassignedRightIds() {
    const rightIndexData = this.rightIndexRef.val;
    const rightData = this.rightEntryRef.val;

    if (!rightData) {
      return EmptyArray;
    }

    if (!rightIndexData) {
      // no object indexed yet
      return Object.keys(rightData);
    }

    return Object.keys(rightData).filter(rightId =>
      isEmpty(rightIndexData[rightId]));
  }

  findUnassignedRightEntries() {
    const rightIndexData = this.rightIndexRef.val;
    const rightData = this.rightEntryRef.val;
    const rightName = this.rightName;

    if (!rightData) {
      return EmptyObject;
    }

    if (!rightIndexData) {
      // no object indexed yet
      return rightData;
    }
    
    return pickBy(rightData, (rightData, rightId) =>
      isEmpty(rightIndexData[rightId]));
  }

  getLeftIdsByRightId(rightIds) {
    return this.rightIndexRef.getAllData(rightIds);
  }

  getRightIdsByLeftId(leftIds) {
    return this.leftIndexRef.getAllData(leftIds);
  }

  _getCleanKeys(v) {
    return Object.keys(pickBy(v, id => !!id));
  }

  _getEntryOrEntries(idOrIds, result) {
    if (!isArray(idOrIds)) {
      // only one id was given -> return result
      return result[idOrIds] || EmptyObject;
    }
    return result;
  }

  getLeftEntriesByRightId(rightIds) {
    const leftIds = this.getLeftIdsByRightId(rightIds);

    // structure: { rightId_i: {leftId_i: 1 ...} ...}, where leftId_i might be null

    const result = mapValues(leftIds,
      v => this.leftEntryRef.getAllData(this._getCleanKeys(v))
    );

    // structure: { rightId_i: {leftId_i: leftEntry_i ...} ...}

    return this._getEntryOrEntries(rightIds, result);
  }

  getRightEntriesByLeftId(leftIds) {
    const rightIds = this.getRightIdsByLeftId(leftIds);
    const result = Object.values(rightIds).filter(v => !!v);
    if (isEmpty(result)) {
      return EmptyObject;
    }
    return this.rightEntryRef.getAllData(result);
  }

  addEntry(entry) {
    const leftId = entry[this.leftName];
    const rightId = entry[this.rightName];

    return Promise.all([
      this.rightIndexRef.setChild(pathJoin(rightId, leftId), 1),
      this.leftIndexRef.setChild(pathJoin(leftId, rightId), 1)
    ]);
  }

  deleteEntry(entry) {
    const leftId = entry[this.leftName];
    const rightId = entry[this.rightName];
    
    return Promise.all([
      this.rightIndexRef.setChild(pathJoin(rightId, leftId), null),
      this.leftIndexRef.setChild(pathJoin(leftId, rightId), null)
    ]);
  }

  // queries the entire reference path + index, and 
  //    validates index integrity
  // returns a promise which eventually returns a set
  //    of inconsistencies (if any)
  validateIndex() {
    // if (this.filter && !isEmpty(this.filter)) {
    //   throw new Error('cannot validate index when filter is active');
    // }
    const leftData = this.leftIndexRef.val;
    const rightData = this.rightIndexRef.val;
    
    const inconsistencies = [];

    // for every right id R added to the left id L,
    //    L must also be added to R
    for (let leftId in leftData) {
      const rightIds = leftData[leftId];
      for (let rightId in rightIds) {
        const rightEntry = rightData[rightId];
        if (!rightEntry[leftId]) {
          inconsistencies.push([leftId, rightId]);
        }
      }
    }

    // for every L added to R,
    //    R must also be added to L
    for (let rightId in rightData) {
      const leftIds = rightData[rightId];
      for (let leftId in leftIds) {
        const leftEntry = leftData[leftId];
        if (!leftEntry[rightId]) {
          inconsistencies.push([leftId, rightId]);
        }
      }
    }


    // TODO: check if the objects of all indexed ids actually exist in leftEntryRef + rightEntryRef

    return inconsistencies;
  }

  // used to rebuild given index
  //  (e.g. when it's new, broken or structurally modified)
  fixInconsistencies(inconsistencies) {
    if (this.filter && !isEmpty(this.filter)) {
      throw new Error('cannot build index when filter is active');
    }

    for (let i = 0; i < inconsistencies.length; ++i) {
      const [leftId, rightId] = inconsistencies[i];
      // TODO: fix it!
    }
  }
}
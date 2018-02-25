import _ from 'lodash';
import isArray from 'lodash/isArray';
import isArrayLike from 'lodash/isArrayLike';
import sortBy from 'lodash/sortBy';

/**
 * Determine whether two arrays contain exactly the same elements, independent of order.
 * @see https://stackoverflow.com/questions/32103252/expect-arrays-to-be-equal-ignoring-order/48973444#48973444
 */
function cmpIgnoreOrder(a, b) {
  const { every, includes } = _;
  return a.length === b.length && every(a, v => includes(b, v));
}

const globalDefaultConfig = {
  keys: [],

  /**
   * Whether the index should be handled as property, and added as property to object on write.
   * Set this to false for indices representing parent path keys/ids.
   * 
   * Relation to `updateOnWrite`: 
   * If `isProperty` is set to `false`, 
   *    the index will never be written.
   * If `isProperty` is `true` and `updateOnWrite` is `false`, 
   *    it will at least be written initially.
   * 
   * Default: true.
   */
  isProperty: true,

  /**
   * Whether to update the index on every 
   * write operation (given it's keys are present).
   * If this is set to false, it will only try 
   * to write the index when it has not previously 
   * been written.
   * 
   * Default: false.
   * Reason: Often indices are set on properties that never change.
   */
  updateOnWrite: false,

  // Whether to show a warning when an index cannot 
  // be updated due to missing key data.
  // You only want to set this to true when you are sure 
  // that all required keys are set at 
  // every possible index update (at every write).
  isRequired: true,

  /**
   * Whether the encoded values should be simplified.
   * This makes them simpler but also might risk chances of ambiguity
   * (different values encoded to the same result).
   * You want to turn this off, if you have keys that contain non-constrained sets of characters,
   *    and/or have other risks for keys to mash up into each other, 
   *    and thus risk non-uniqueness between different inputs.
   */
  forceSimpleEncoding: true
};

export function makeIndices(cfg, defaultSettings) {
  return new IndexSet(cfg, defaultSettings);
}

const IndexUtils = {
  sanitizeConfig(cfg, localDefaults) {
    return _.zipObject(_.keys(cfg), 
      _.map(cfg, (indexCfg, indexName) => {
        let cfgEntry;
        if (isArray(indexCfg)) {
          // only provide array of keys
          cfgEntry = { 
            keys: indexCfg
          };
        }
        else if (_.isString(indexCfg)) {
          // only provide name of single key
          cfgEntry = {
            keys: [indexCfg]
          };
        }
        else if (_.isPlainObject(indexCfg)) {
          // provide full configuration for index
          if (!isArray(indexCfg.keys)) {
            //console.warn('Invalid index config missing or invalid keys property (should be array): ' + JSON.stringify(cfg));
          }
          cfgEntry = indexCfg;
        }
        else {
          //console.warn('Invalid index config has invalid entry: ' + indexName);
          cfgEntry = {};
        }

        return Object.assign({}, globalDefaultConfig, localDefaults, cfgEntry);
      })
    );
  },

  convertToSortedValueSet(val, nDepth) {
    nDepth = nDepth || 0;
    if (nDepth > 10) {
      console.error('[ERROR] Could not encode value; possible recursive values: ' + val);
      return null;
    }

    if (_.isUndefined(val)) {
      val = null;
    }
    if (_.isString(val)) {
      return val;
    }
    else if (_.isArrayLike(val)) {
      return _.map(val, child => this.convertToSortedValueSet(child, nDepth+1));
    }
    else if (_.isPlainObject(val)) {
      // make sure, entries in resulting string representation are sorted by key
      const converted = _.flatten(_.map(val, (v, k) => [k, this.convertToSortedValueSet(v)]));
      return sortBy(converted, ([k, v]) => k);
    }
    return val;
  },

  encodeValue(val, forceSimple) {
    if (_.isFunction(val) || _.isElement(val) || _.isError(val)) {
      throw new Error('[ERROR] Cannot encode element or function values - ' + val);
    }
    if (_.isString(val) || _.isBoolean(val) || _.isNumber(val) || _.isNull(val)) {
      return val;
    }
    if (_.isDate(val)) {
      return val.getTime();
    }
    if (forceSimple) {
      if (_.isArrayLike(val)) {
        return _.join(val, '\uFFFF');
      }
      else if (_.isPlainObject(val)) {
        // object should already have been converted to a sorted array
        throw new Error('[ERROR] Something went wrong... object could not be encoded: ' + JSON.stringify(val));
      }
      else if (_.isMap(val) || _.isSet(val) || _.isBuffer(val) || _.isSymbol(val) || _.isRegExp(val)) {
        throw new Error('[ERROR] NYI - cannot yet encode values of this type: ' + val);
      }
      else {
        throw new Error('[ERROR] Could not encode value (unknown type): ' + val);
      }
    }
    else {
      return _.isArrayLike(val) && JSON.stringify(val) || val;
    }
  },

  // makes sure that two vals will always convert to the same string
  // given that the structure of any two different vals of the same set does not change too much.
  encodeValueDeep(val, forceSimple) {
    return this.encodeValue(this.convertToSortedValueSet(val), forceSimple);
  }
};

class IndexSet {

  /**
   * {cfg} Index definitions: Each index name is assigned an array of all keys that participate in it.
   */
  constructor(cfg, defaultSettings) {
    // the cfg object supports some short-hands, which are unrolled in completeCfg
    const completeCfg = IndexUtils.sanitizeConfig(cfg, defaultSettings);

    // create object of type { indexName => [ key1, key2...] }
    let allKeySets = _.map(completeCfg, 'keys');
    allKeySets = _.map(allKeySets, keySet => sortBy(keySet));
    const keysByIndexName = _.zipObject(_.keys(completeCfg), allKeySets);

    // create object of type { key => [indexName1, indexName2...] }
    const indexNamesByKey = {};
    for (const indexName in keysByIndexName) {
      const keys = keysByIndexName[indexName];
      keys.forEach(key => {
        //console.assert(isArrayLike(indexNamesByKey[key]), 'invalid index with key `' + key + '` (is not but) must be array ' + indexNamesByKey[key]);
        let arr = indexNamesByKey[key];
        if (!arr) {
          arr = indexNamesByKey[key] = [];
        }
        arr.push(indexName);
      });
    }

    this.cfg = completeCfg;

    this.indexNames = _.keys(keysByIndexName);
    this.allKeys = _.keys(indexNamesByKey);

    this.keysByIndexName = keysByIndexName;
    this.indexNamesByKey = indexNamesByKey;
  }

  // names of all indices this key is participating in
  getIndexNamesByKey(key) {
    return this.indexNamesByKey[key];
  }

  getIndexNameByKeys(keys) {
    //return _.findKey(this.keysByIndexName, v => _.isEqual(v, keys));
    return _.findKey(this.keysByIndexName, keyArr => cmpIgnoreOrder(keyArr, keys));
  }

  doesQueryMatchAnyIndex(query) {
    return !!this.getIndexNameOfQuery(query);
  }

  // array of keys participating in the given query
  getKeysOfQuery(query) {
    return Object.keys(query);
  }

  //  
  getIndexNameOfQuery(query) {
    const name = this.getIndexNameByKeys(Object.keys(query));
    //console.assert(name,);
    return name;
  }

  // whether the given key (or: child property) participates in any index
  isIndexedKey(key) {
    return !!this.indexNamesByKey[key];
  }

  _invalidQuery(query) {
    throw new Error(`Keys of query do not match any index: ${JSON.stringify(query)}.
All indices: ${JSON.stringify(this.keysByIndexName, null, 2)}`);
  }

  where(query) {
    // console.log({
    //   orderByChild: indexName,
    //   equalTo: queryValue
    // });
    const keys = Object.keys(query);
    const indexName = this.getIndexNameByKeys(keys);
    if (!indexName) {
      this._invalidQuery(query);
    }
    return [
      ['orderByChild', indexName],
      ['equalTo', this.encodeQueryValueByKeys(query, keys)]
    ];
  }

  encodeQueryValue(query) {
    const keys = _.keys(query);
    const indexName = this.getIndexNameByKeys(keys);
    if (!indexName) {
      this._invalidQuery(query);
    }
    return this.encodeQueryValueByKeys(query, keys);
  }

  encodeQueryValueByKeys(val, keys) {
    if (!keys || !keys.length) {
      console.error('Invalid query: keys are empty.');
      return null;
    }

    const indexName = this.getIndexNameByKeys(keys);
    if (!indexName) {
      this._invalidQuery(keys);
    }
    keys = this.keysByIndexName[indexName];
    
    const settings = this.getCfg(indexName);

    if (keys.length === 1) {
      return IndexUtils.encodeValueDeep(val[keys[0]], settings.forceSimpleEncoding);
    }
    const values = _.map(keys, key => val[key]);
    return IndexUtils.encodeValueDeep(values, settings.forceSimpleEncoding);
  }

  getCfg(indexName) {
    return this.cfg[indexName];
  }

  // called before write to any object of indexed path
  updateIndices(val) {
    if (!_.isObject(val)) return;
    
    for (var indexName in this.keysByIndexName) {
      const cfg = this.getCfg(indexName);

      // isProperty must be true, and either updateOnWrite is true, or index has not been written yet
      if (cfg.isProperty && (cfg.updateOnWrite || !val[indexName])) {
        const keys = this.keysByIndexName[indexName];

        // single-entry keys are already properties don't need explicit writes
        if (keys.length < 2) continue;

        if (_.some(keys, key => !_.has(val, key))) {
          // problem: at least one of the participating keys is missing!
          if (this.cfg[indexName].isRequired) {
            console.warn(`Could not update indices on object because value did not define index "${indexName}", and is also missing some of its keys: 
              [${keys}]\n${JSON.stringify(val)}`);
          }
          continue;
        }

        val[indexName] = this.encodeQueryValueByKeys(val, keys);
      }
    }
  }
}
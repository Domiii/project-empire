import _ from 'lodash';


const defaultConfig = {
  keys: [],

  // Whether to automatically update the index at all.
  // Difference to `writeAlways` is that: 
  // If `autoUpdate` is set to `false`, 
  //    the index will never be written.
  // If `autoUpdate` is `true` and `writeAlways` is `false`, 
  //    it will at least be written initially.
  autoUpdate: true,

  // Whether to update the index on every 
  // write operation (given it's keys are present).
  // If this is set to false, it will only try 
  // to write the index when it has not previously 
  // been written.
  writeAlways: false,

  // Whether to show a warning when an index cannot 
  // be updated due to missing key data.
  // You only want to set this to true when you are sure 
  // that all required key data will be written for 
  // every possible index update.
  isRequired: false,

  // Whether the encoded values should be simplified.
  // This makes them simpler but also might risk chances of ambiguity (different values encoded to the same result).
  forceSimpleEncoding: false
};

export function makeIndices(cfg) {
  return new IndexSet(cfg);
}

const IndexUtils = {
  sanitizeConfig(cfg) {
    return _.zipObject(_.keys(cfg), 
      _.map(cfg, (indexCfg, indexName) => {
        let cfgEntry;
        if (_.isArray(indexCfg)) {
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
          if (!_.isArray(indexCfg.keys)) {
            //console.warn('Invalid index config missing or invalid keys property (should be array): ' + JSON.stringify(cfg));
          }
          cfgEntry = indexCfg;
        }
        else {
          //console.warn('Invalid index config has invalid entry: ' + indexName);
          cfgEntry = {};
        }

        return Object.assign({}, defaultConfig, cfgEntry);
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
      return _.sortBy(converted, ([k, v]) => k);
    }
    return val;
  },

  encodeValue(val, forceSimple) {
    if (_.isFunction(val) || _.isElement(val) || _.isError(val)) {
      throw new Error("[ERROR] Cannot encode element or function values - " + val);
    }
    if (_.isString(val) || _.isBoolean(val) || _.isNumber(val) || _.isNull(val)) {
      return val + "";
    }
    if (forceSimple) {
      if (_.isArrayLike(val)) {
        return _.join(val, '\uFFFF');
      }
      else if (_.isDate(val)) {
        return val.getTime() + "";
      }
      else if (_.isPlainObject(val)) {
        // object should already have be converted to a sorted array
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
      return JSON.stringify(val);
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
  constructor(cfg) {
    // the cfg object supports some short-hands, which are unrolled in completeCfg
    const completeCfg = IndexUtils.sanitizeConfig(cfg);

    // create object of type { indexName => [ key1, key2...] }
    const keysByIndexName = _.zipObject(_.keys(completeCfg), _.map(completeCfg, 'keys'));

    // create object of type { key => [indexName1, indexName2...] }
    const indexNamesByKey = {};
    for (const indexName in keysByIndexName) {
      const keys = keysByIndexName[indexName];
      keys.forEach(key => 
        indexNamesByKey[key] = indexNamesByKey[key] && indexNamesByKey[key].push(indexName) || [indexName]);
    }

    this.cfg = completeCfg;

    this.indexNames = _.keys(keysByIndexName);
    this.keys = _.keys(indexNamesByKey);

    this.keysByIndexName = keysByIndexName;
    this.indexNamesByKey = indexNamesByKey;
  }

  // names of all indices this key is participating in
  getIndexNamesByKey(key) {
    return this.indexNamesByKey[key];
  }

  getIndexNameByKeys(keys) {
    return _.findKey(this.keysByIndexName, v => _.isEqual(v, keys));
  }

  // array of keys participating in the given query
  getKeysOfQuery(query) {
    return _.keys(query);
  }

  //  
  getIndexNameOfQuery(query) {
    const name = _.findKey(this.keysByIndexName, _.keys(query));
    console.assert(name,
      `Query contains keys that are not indexed: ${JSON.stringify(query)}. - All keys: ${this.keys}`);
    return name;
  }

  // whether the given key (or: child property) participates in any index
  isIndexedKey(key) {
    return !!this.indexNamesByKey[key];
  }

  where(query) {
    // console.log({
    //   orderByChild: indexName,
    //   equalTo: queryValue
    // });
    const keys = _.keys(query);
    const indexName = this.getIndexNameByKeys(keys);
    if (!indexName) {
      throw new Error('invalid query - keys did not match any index: ' + JSON.stringify(query));
    }
    return [
      `orderByChild=${indexName}`,
      `equalTo=${this.encodeQueryValueByKeys(query, keys)}`
    ];
  }

  encodeQueryValue(query) {
    const keys = _.keys(query);
    const indexName = this.getIndexNameByKeys(keys);
    if (!indexName) {
      throw new Error('invalid query - keys did not match any index: ' + JSON.stringify(query));
    }
    return this.encodeQueryValueByKeys(query, keys);
  }

  encodeQueryValueByKeys(val, keys) {
    if (!keys || !keys.length) {
      console.error('Invalid query: keys are empty.');
      return null;
    }

    const indexName = this.getIndexNameByKeys(keys);
    const settings = this.getCfg(indexName)

    if (keys.length == 1) {
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
      if (cfg.autoUpdate && (cfg.writeAlways || !val[indexName])) {
        // either writeAlways is true, 
        //    or index has not been written yet
        const keys = this.keysByIndexName[indexName];

        // simple keys are don't need explicit writes
        if (keys.length < 2) continue;

        if (_.some(keys, key => !_.has(val, key))) {
          // problem: at least one of the participating keys is missing!
          if (this.cfg[indexName].isRequired) {
            console.warn(`Updated value did not define index "${indexName}", and is also missing some of its keys: 
              [${keys}]\n${JSON.stringify(val)}`);
          }
          continue;
        }

        val[indexName] = this.encodeQueryValueByKeys(val, keys);
      }
    }
  }
}
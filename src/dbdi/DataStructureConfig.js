import map from 'lodash/map';
import mapValues from 'lodash/mapValues';
import isEmpty from 'lodash/isEmpty';
import isString from 'lodash/isString';
import isFunction from 'lodash/isFunction';
import isPlainObject from 'lodash/isPlainObject';
import intersection from 'lodash/intersection';

import { pathJoin } from 'src/util/pathUtil';

import { EmptyObject } from 'src/util';

export function parseConfig(cfg) {
  if (cfg instanceof DataStructureConfig) {
    // already parsed!
    return cfg;
  }

  // raw configuration input
  return new DataStructureConfig(cfg);
}

export default class DataStructureConfig {
  children;

  constructor(cfg) {
    this.children = parseConfigChildren(null, cfg);
  }
}

export function parseConfigChildren(parent, children) {
  if (parent !== null && !(parent instanceof DataStructureConfigNode)) {
    debugger;
    throw new Error('invalid configuration: parent must be null or an instance of `DataStructureConfigNode`');
  }
  return mapValues(children || EmptyObject, (childCfg, name) =>
    childCfg instanceof DataStructureConfigNode ?
      childCfg :
      new DataStructureConfigNode(name, parent, childCfg)
  );
}

/**
 * A parsed "dataConfig" object.
 * Allows composing of local descriptors built from descriptors imported from other places.
 */
export class DataStructureConfigNode {
  name;

  parent;
  children = {};

  /**
   * This node's (or the parent's) dataProvider name
   */
  dataProviderName;

  /**
   * The path configuration of this node.
   * 
   * @type {object}
   * @property {string} pathTemplate The pathTemplate string
   * @property {array} queryParams Additional arguments passed to the query of this path
   * @property {function} pathFn A function to build the path at run-time and override the path template setting
   */
  pathConfig;

  /**
   * Whether this node has been explicitly configured as read-only.
   */
  isReadOnly;

  /**
   * A custom reader configuration for this node.
   * Will simply use the pathConfig to create a reader if none is given.
   */
  reader;

  /**
   * A fetch function to be called when this node is read but not loaded yet.
   * This can be used to un API calls to fetch data on first read, which
   * then stays cached in this node.
   * Only useful in combination with DataProviders that do not have their own
   * backend handling mechanism, such as MemoryDataProvider.
   * 
   * TODO: Allow for more configuration parameters to automatically identify stale data
   */
  fetch;

  // TODO: writeThrough (can probably be done just fine using a combination of onWrite + fetch?)

  /**
   * A custom writer configuration for this node.
   * Will simply use the pathConfig to create writer if none is given.
   */
  writer;

  /**
   * Called to make modifications to written object
   */
  onWrite;

  constructor(name, parent, cfg) {
    this.name = name;
    this.parent = parent;

    cfg !== null && cfg !== undefined || 
      console.error('DataStructureConfig missing config object:', name, parent);

    this._parseConfig(cfg);
  }


  // ################################################
  // Private methods
  // ################################################

  _parseConfig(cfg) {
    if (isFunction(cfg)) {
      // path transformation function
      this._parsePath(cfg, cfg);
      
      this._ensureDataProvider(cfg);
    }
    else if (isString(cfg)) {
      // path string
      this._parsePath(cfg, cfg);
      
      this._ensureDataProvider(cfg);
    }
    else if (isPlainObject(cfg)) {
      // more complex descriptor node
      //Object.assign(this, cfg);

      // TODO: hasMany, relationship stuff and a lot of other customizations should be entirely be handled from the outside (via Plugin mechanics)
      this.hasMany = cfg.hasMany;
      this.isReadOnly = cfg.isReadOnly || false;
      this._parsePath(cfg, cfg.path !== undefined ? cfg.path : cfg.pathTemplate);
      this._parseReader(cfg);
      this._parseFetch(cfg);
      this._parseWriter(cfg);
      

      this.dataProviderName = cfg.dataProvider;
      this._ensureDataProvider(cfg);

      // parse children and recurse, once this node has been taken care of
      this._parseChildren(cfg);
      
      // parse "readers" and "writers" (and add them to children)
      this._parseReaders(cfg);
      this._parseWriters(cfg);
    }
    else {
      throw new Error('could not parse invalid config object: ' + this.name);
    }
  }

  _ensureDataProvider(cfg) {
    this.dataProviderName = this.dataProviderName || (this.parent && this.parent.dataProviderName);
    if (this.parent && this.pathConfig && !this.dataProviderName) {
      console.error(this.parent, '>', this.name);
      throw new Error('Missing dataProvider in config: ' + this.name + ' - ' + JSON.stringify(cfg, null, 2));
    }
  }

  _parsePath(cfg, pathConfig) {
    const { parent } = this;
    const parentPath = parent && parent.pathConfig && parent.pathConfig.pathTemplate || '';
    if (pathConfig === null || pathConfig === undefined) {
      if (!cfg || !cfg.children) {
        this.pathConfig = null;
        return;
      }
      else {
        pathConfig = '';
      }
    }

    let pathTemplate;
    let queryParams = null;
    let indices = null;
    let pathFn = null;

    if (isString(pathConfig)) {
      pathTemplate = pathConfig;
    }
    else if (isPlainObject(pathConfig)) {
      pathTemplate = pathConfig.path || pathConfig.pathTemplate;
      queryParams = pathConfig.queryParams;
      indices = pathConfig.indices;
    }

    if (!isString(pathTemplate)) {
      if (isFunction(pathTemplate)) {
        pathFn = pathTemplate;
      }
      pathTemplate = '';
    }

    // join with parent path
    const localPathTemplate = pathTemplate;
    pathTemplate = pathJoin(parentPath, pathTemplate);

    this.pathConfig = {
      pathTemplate,
      localPathTemplate,
      queryParams,
      indices,
      pathFn
    };
  }

  _checkSpecializedChildrenStructure(children, otherChildren, childrenName) {
    // want a plain object
    console.assert(isPlainObject(otherChildren),
      `invalid "${childrenName}" node is not plain object in DataStructureConfigNode: ` + this.name);

    if (children) {
      // check for naming conflict
      const readerNames = Object.keys(otherChildren);
      const childNames = Object.keys(children);
      const overlap = intersection(readerNames, childNames);
      if (!isEmpty(overlap)) {
        throw new Error(`invalid "${childrenName}" definitions have name conflict with ` +
          `"children" in DataStructureConfigNode "${this.name}": ${overlap.join(', ')} exist in both`);
      }
    }
  }

  _parseChildren(cfg) {
    this.children = cfg.children && parseConfigChildren(this, cfg.children) || null;
  }

  _parseReader(cfg) {
    if (cfg.read || cfg.reader) {
      // a custom reader for this node
      this.reader = cfg.read || cfg.reader;
    }
  }

  _parseFetch(cfg) {
    //if (cfg.fetch) {
    // a custom reader for this node
    this.fetch = cfg.fetch;
    //}
  }

  _parseReaders(cfg) {
    if (cfg.readers) {
      // multiple readers that are actually children of this node
      const { readers } = cfg;

      // check for name conflict between "readers" and "children"
      this._checkSpecializedChildrenStructure(this.children, readers, 'readers');

      // add reader-only children
      const readerNodes = mapValues(readers, (reader, name) =>
        new DataStructureConfigNode(name, this, { reader })
      );

      this.children = Object.assign({}, this.children, readerNodes);
    }
  }

  _parseWriter(cfg) {
    if (cfg.write || cfg.writer) {
      // a custom writer for this node
      this.writer = cfg.write || cfg.writer;
    }
    this.onWrite = cfg.onWrite;
  }

  _parseWriters(cfg) {
    if (cfg.writers) {
      // multiple writers that are actually children of this node
      const { writers } = cfg;

      // check for name conflict between "readers" and "children"
      this._checkSpecializedChildrenStructure(this.children, writers, 'writers');

      // add writer-only children
      const writerNodes = mapValues(writers, (writer, name) =>
        new DataStructureConfigNode(name, this, { writer })
      );
      this.children = Object.assign({}, this.children, writerNodes);
    }
  }
}

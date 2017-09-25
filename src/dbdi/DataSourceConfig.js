import map from 'lodash/map';
import isEmpty from 'lodash/isEmpty';
import isString from 'lodash/isString';
import isFunction from 'lodash/isFunction';
import isPlainObject from 'lodash/isPlainObject';
import intersection from 'lodash/intersection';

import { pathJoin } from 'src/util/pathUtil';

import { EmptyObject } from 'src/util';

function parseConfigChildren(parent, children) {
  return map(children, (childCfg, name) =>
    new DataSourceConfigNode(name, parent, childCfg)
  );
}
export default class DataSourceConfig {
  children;

  constructor(cfg) {
    this.children = parseConfigChildren(null, cfg);
  }
}

/**
 * A parsed "dataConfig" object.
 * Allows composing of local descriptors built from descriptors imported from other places.
 */
export class DataSourceConfigNode {
  name;
  dataProviderName;
  
  parent;
  children = {};

  isReadOnly;
  pathConfig;
  reader;
  writer;

  constructor(name, parent, cfg) {
    this.name = name;
    this.parent = parent;
    this.isReadOnly = cfg.isReadOnly || false;

    this._parseConfig(cfg);
  }

  _parseConfig(cfg) {
    this.dataProviderName = cfg.dataProvider || (this.parent && this.parent.dataProviderName);
    console.assert(this.dataProviderName, 'Node does not have dataProviderName: ' + name);

    if (isString(cfg)) {
      // path string
      this._parsePath(cfg);
    }
    else if (isFunction(cfg)) {
      // path transformation function
      this._parsePath(cfg);
    }
    else if (isPlainObject(cfg)) {
      // more complex descriptor node
      this._parsePath(cfg.path || cfg.pathTemplate);
      this._parseChildren(cfg);
      this._parseReaders(cfg);
      this._parseWriters(cfg);
    }
    else {
      throw new Error('could not parse invalid config object: ' + this.name);
    }
  }

  _parsePath(pathConfig) {
    if (!pathConfig) {
      this.pathConfig = null;
      return;
    }

    let pathTemplate;
    let queryParams = null;
    let pathFn;

    if (isString(pathConfig)) {
      pathTemplate = pathConfig;
    }
    else if (isPlainObject(pathConfig)) {
      pathTemplate = pathConfig.path || pathConfig.pathTemplate;
      queryParams = pathConfig.queryParams;
    }

    if (!isString(pathTemplate)) {
      if (isFunction(pathTemplate)) {
        pathFn = pathTemplate;
      }
      pathTemplate = '';
    }

    // join with parent path
    pathTemplate = pathJoin(parent.pathConfig.pathTemplate, pathTemplate);

    this.pathConfig = {
      pathTemplate,
      queryParams,
      pathFn
    };
  }

  _parseReader(cfg) {
    if (cfg.read || cfg.reader) {
      // a reader for this node
      this.reader = cfg.read || cfg.reader;
    }
  }
  
  _parseReaders(cfg) {
    if (cfg.readers) {
      // multiple readers that are actually children of this node
      const { readers } = cfg;

      // readers 
      console.assert(isPlainObject(readers), 
        'invalid "readers" node is not (but must be) "plain object" in DataSourceConfig node: ' + this.name);

      const readerNames = Object.keys(readers);
      const childNames = Object.keys(this.children);
      const overlap = intersection(readerNames, childNames);
      console.assert(isEmpty(overlap),
        'invalid "readers" node has name conflict with "children" in DataSourceConfig node: ' + this.name);

      // add new reader children
      const readerNodes = map(readers, (reader, name) =>
        new DataSourceConfigNode(name, parent, { reader })
      );
      Object.assign(this.children, readerNodes);
    }
  }

  _parseWriter(cfg) {
    if (cfg.write || cfg.writer) {
      // a writer for this node
      this.writer = cfg.write || cfg.writer;
    }
  }

  _parseWriters(cfg) {
    if (cfg.writers) {
      // multiple writers that are actually children of this node
      console.assert(isPlainObject(cfg.writers), 'invalid "writers" node is not plain object in: ' + this.name);

      // TODO: fix this after "readers" work
      console.error('NIY: "writers" in DataSourceConfigNode');
    }
  }

  _parseChildren(cfg) {
    this.children = cfg.children && parseConfigChildren(this, cfg.children) || null;
  }
}

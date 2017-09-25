import map from 'lodash/map';
import forEach from 'lodash/forEach';
import isString from 'lodash/isString';
import isArray from 'lodash/isArray';
import isFunction from 'lodash/isFunction';
import isPlainObject from 'lodash/isPlainObject';

import { pathJoin } from 'src/util/pathUtil';

import { EmptyObject, EmptyArray } from 'src/util';

function parseConfigChildren(parent, children) {
  return map(children, (childCfg, name) =>
    new ConfigNode(name, parent, childCfg)
  );
}
class ConfigTree {
  _roots;

  constructor(roots) {
    this._roots = parseConfigChildren(null, roots);
  }
}

/**
 * A parsed "dataConfig" object.
 * Allows composing of local descriptors built from descriptors imported from other places.
 */
export class ConfigNode {
  name;
  dataProviderName;
  pathTemplate;
  pathConfig;
  reader;
  writer;
  parent;
  children;

  constructor(name, parent, cfg) {
    this.name = name;
    this.parent = parent;

    this._parseConfig(cfg);
    // TODO: make sure there are no cycles in dependency graph to avoid infinite loops
    // TODO: can also be used to be exported and added into other dataConfigs
    // TODO: more...
    //  1) allow for RefWrapper-type config parsing, with pathTemplate also to be called "path" + advanced features
    //  2) handle + properly name node types: PathDescriptor (path string + fn), reader (fn), writer (fn).
    //  3) merge all nodes back into all ascendants when not ambiguous.
    //    Note: if name is on this node, and the same name is used down the line, add the descriptor from "this node"
    //    Note: in all other cases of ambiguity, insert "ambiguous error" descriptor
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
    }
    else {
      throw new Error('could not parse invalid config object: ' + this.name);
    }
  }

  _parsePath(pathConfig) {
    if (!pathConfig) {
      this.pathConfig = EmptyObject;
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

    // join with parent template
    pathTemplate = pathJoin(parent.pathConfig.pathTemplate, pathTemplate);

    this.pathConfig = {
      pathTemplate,
      queryParams,
      pathFn
    };
  }

  _parseReaders(cfg) {
    if (cfg.read || cfg.reader) {
      // a reader for this node
      this.reader = cfg.read || cfg.reader;
    }
    else if (cfg.readers) {
      // readers that are actually children of this node
      console.assert(isPlainObject(cfg.readers), 'invalid "readers" node is not plain object in: ' + this.name);
    }
  }

  _parseWriters(cfg) {
    if (cfg.write || cfg.writer) {
      // a writer for this node
      this.writer = cfg.write || cfg.writer;
    }
    else if (cfg.writers) {
      // multiple writers that are actually children of this node
      console.assert(isPlainObject(cfg.writers), 'invalid "writers" node is not plain object in: ' + this.name);
    }
  }

  _parseChildren(cfg) {
    this.children = cfg.children && parseConfigChildren(this, cfg.children) || null;
  }
}

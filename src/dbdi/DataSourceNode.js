import forEach from 'lodash/forEach';

import autoBind from 'src/util/auto-bind';

import { EmptyObject, EmptyArray } from 'src/util';

// TODO: let all data path/read/write nodes of the same name easily access each other

/**
 * The DataSourceNode provides access to a specific name in the data hierarchy 
 * through di (dependency injection) proxies and is at the core of the data model.
 * The node has access to all the named nodes defined in it and it's descendants (if named unambiguously).
 * The node connects the (Path/DataRead/DataWrite)Descriptors' with the given DataProviders.
 */
export default class DataSourceNode {
  name;
  fullName;

  _tree;
  _parent;
  _dataProvider;

  _pathDescriptor;
  _writeDescriptor;
  _readDescriptor;

  _injectProxy;
  _readersProxy;
  _writersProxy;

  _children = {};
  _readDescendants = {};
  _writeDescendants = {};

  constructor(tree, parent, dataProvider, name, fullName, pathDescriptor, readDescriptor, writeDescriptor) {
    //console.log('Building DataSourceNode: ' + name);

    this.name = name;
    this.fullName = fullName;

    this._tree = tree;
    this._parent = parent;
    this._dataProvider = dataProvider;
    this._pathDescriptor = pathDescriptor;
    this._readDescriptor = readDescriptor;
    this._writeDescriptor = writeDescriptor;

    autoBind(this);

    this._buildProxies();
  }


  // ################################################
  // Private methods
  // ################################################

  _buildProxies() {
    this._injectProxy = new Proxy({}, this._buildReadByNameHandler);
    this._readersProxy = new Proxy({}, this._buildReadersByNameHandler);
  }

  _buildReadersByNameHandler() {
    return {
      get: (target, name) => {
        // resolve node and return call function to caller.
        // let caller decide when to make the actual call and which arguments to supply.
        const node = this.resolveReader(name);
        return node && node.readData;
      }
    };
  }

  _buildReadByNameHandler() {
    return {
      get: (target, name) => {
        // resolve node and return read data
        const node = this.resolveReader(name);
        return node && node.readData();
      }
    };
  }

  // ################################################
  // Public properties + methods
  // ################################################

  get dataProvider() {
    return this._dataProvider;
  }

  get isReader() {
    return !!this._readDescriptor;
  }

  get isWriter() {
    return !!this._writeDescriptor;
  }

  // isNameLoaded(sourceName, args) {
  //   const node = this.resolveName(sourceName);
  //   if (!node) {
  //     throw new Error('invalid node name: ' + sourceName);
  //   }
  //   return !node.isDataLoaded(args);
  // }

  hasReader(name) {
    return !!this._readDescendants[name];
  }

  hasWriter(name) {
    return !!this._writeDescendants[name];
  }

  resolveReader(name) {
    const node = this._readDescendants[name];
    if (!node) {
      console.error(`Requested reader "${name}" does not exist in parent "${this.name}"`);
    }
    return node;
  }

  resolveWriter(name) {
    const node = this._writeDescendants[name];
    if (!node) {
      console.error(`Requested writer "${name}" does not exist in parent "${this.name}"`);
    }
    return node;
  }
  
  isDataLoaded(args) {
    return this._readDescriptor.readData(args, this._injectProxy, this._readersProxy, this);
  }

  readData(args) {
    args = args || EmptyObject;
    if (!this._readDescriptor) {
      throw new Error(`Tried to read data from "${this.name}", but node does not have a reader.`);
    }

    return this._readDescriptor.readData(args, this._injectProxy, this._readersProxy, this);
  }

  writeData(args, val) {
    args = args || EmptyObject;
    if (!this._writeDescriptor) {
      throw new Error(`Tried to write data to "${this.name}", but node does not have a writer.`);
    }
    throw new Error('NYI writeData');
    //return this._readDescriptor.writeData(args, val, this._injectProxy, this._readersProxy, this);
  }
}

export class AmbiguousSourceNode {
  name;
  fullNames;

  constructor(name, ...fullNames) {
    this.name = name;
    this.fullNames = fullNames;
  }

  // ################################################
  // Public properties + methods
  // ################################################

  get isReader() {
    return false;
  }

  get isWriter() {
    return false;
  }

  hasReader(name) {
    throw new Error('[ERROR] Tried to call hasReader on ' + this);
  }

  hasWriter(name) {
    throw new Error('[ERROR] Tried to call hasWriter on ' + this);
  }

  resolveReader(name) {
    throw new Error('[ERROR] Tried to call resolveReader on ' + this);
  }

  resolveWriter(name) {
    throw new Error('[ERROR] Tried to call resolveWriter on ' + this);
  }

  isDataLoaded(args) {
    throw new Error('[ERROR] Tried to call isDataLoaded on ' + this);
  }

  readData(args) {
    throw new Error('[ERROR] Tried to call readData on ' + this);
  }

  writeData(args, val) {
    throw new Error('[ERROR] Tried to call writeData on ' + this);
  }

  toString() {
    return `Ambiguous node "${this.name}", might refer to any of: [${this.fullNames.join(', ')}]`;
  }
}
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

    this.readData.isLoaded = this.isDataLoaded;
  }

  // ################################################
  // Public properties + methods
  // ################################################

  get dataProvider() {
    return this._dataProvider;
  }

  get readDescriptor() {
    return this._readDescriptor;
  }

  get writeDescriptor() {
    return this._writeDescriptor;
  }

  get isReader() {
    return !!this._readDescriptor;
  }

  get isWriter() {
    return !!this._writeDescriptor;
  }

  isDataLoaded(args, injectProxy, readersProxy, accessTracker) {
    return this.readData(args, injectProxy, readersProxy, accessTracker) !== undefined;
  }

  readData(args, injectProxy, readersProxy, accessTracker) {
    args = args || EmptyObject;
    if (!this._readDescriptor) {
      throw new Error(`Tried to read data from "${this.fullName}", 
        but node does not have a reader.`);
    }

    return this._readDescriptor.readData(
      args,
      injectProxy,
      readersProxy,
      this,
      accessTracker);
  }

  writeData(args, injectProxy, readersProxy, accessTracker) {
    args = args || EmptyObject;
    if (!this._writeDescriptor) {
      throw new Error(`Tried to write data to "${this.fullName}",
        but node does not have a writer.`);
    }

    return this._writeDescriptor.writeData(
      args,
      injectProxy,
      readersProxy,
      this,
      accessTracker);
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

  isDataLoaded() {
    throw new Error('[ERROR] Tried to call isDataLoaded on ' + this);
  }

  readData() {
    throw new Error('[ERROR] Tried to call readData on ' + this);
  }

  writeData() {
    throw new Error('[ERROR] Tried to call writeData on ' + this);
  }

  toString() {
    return `Ambiguous node "${this.name}", might refer to any of: [${this.fullNames.join(', ')}]`;
  }
}
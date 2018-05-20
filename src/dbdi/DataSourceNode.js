import reduce from 'lodash/reduce';
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
  cfg;
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

  constructor(tree, cfg, parent, dataProvider, name, fullName, 
    pathDescriptor, readDescriptor, writeDescriptor) {
    //console.log('Building DataSourceNode: ' + name);

    this.name = name;
    this.cfg = cfg;
    this.fullName = fullName;

    this._tree = tree;
    this._parent = parent;
    this._dataProvider = dataProvider;
    this._pathDescriptor = pathDescriptor;
    this._readDescriptor = readDescriptor;
    this._writeDescriptor = writeDescriptor;

    autoBind(this);

    this.readData.isLoaded = this.isDataLoaded;
    this.readData.areAllLoaded = this.areAllLoaded;
  }

  // ################################################
  // Public properties + methods
  // ################################################

  get dataProvider() {
    return this._dataProvider;
  }

  get pathDescriptor() {
    return this._pathDescriptor;
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

  isDataLoaded(...allArgs) {
    return this.readData(...allArgs) !== undefined;
  }

  areAllLoaded(idArgs, ...allArgs) {
    return reduce(idArgs, (idArg, res) => res | this.isDataLoaded(idArg, ...allArgs), true);
  }

  readData(args, readerProxy, injectProxy, writerProxy, accessTracker) {
    args = args || EmptyObject;
    if (!this._readDescriptor) {
      throw new Error(`Tried to read data from "${this.fullName}", 
        but node does not have a reader.`);
    }

    return this._readDescriptor.readData(
      args,
      readerProxy,
      injectProxy,
      writerProxy,
      this,
      accessTracker);
  }

  async readOnce(args, readerProxy, injectProxy, writerProxy, accessTracker) {
    args = args || EmptyObject;
    if (!this._readDescriptor) {
      throw new Error(`Tried to read data from "${this.fullName}", 
        but node does not have a reader.`);
    }

    return await this._readDescriptor.readOnce(
      args,
      readerProxy,
      injectProxy,
      writerProxy,
      this,
      accessTracker);
  }

  writeData(args, readerProxy, injectProxy, writerProxy, accessTracker) {
    args = args || EmptyObject;
    if (!this._writeDescriptor) {
      throw new Error(`Tried to write data to "${this.fullName}",
        but node does not have a writer.`);
    }

    return this._writeDescriptor.writeData(
      args,
      readerProxy,
      injectProxy,
      writerProxy,
      this,
      accessTracker);
  }

  forEachNodeInSubTree(fn) {
    fn(this);
    forEach(this._children, child => child.forEachNodeInSubTree(fn));
  }

  getReadDescendantByName(name) {
    return this._readDescendants[name];
  }

  getWriteDescendantByName(name) {
    return this._writeDescendants[name];
  }
}

/**
 * Represents a source node that shares the name with at least one other node
 */
export class AmbiguousSourceNode {
  name;

  /**
   * fullNames of all nodes that have the same name as this node
   */
  fullNames;

  constructor(name, ...fullNames) {
    this.name = name;
    this.fullNames = fullNames;
  }

  // ################################################
  // Public properties + methods
  // ################################################

  get dataProvider() {
    throw new Error('[ERROR] Tried to get dataProvider from ' + this);
  }

  get pathDescriptor() {
    throw new Error('[ERROR] Tried to get pathDescriptor from ' + this);
  }

  get readDescriptor() {
    throw new Error('[ERROR] Tried to get readDescriptor from ' + this);
  }

  get writeDescriptor() {
    throw new Error('[ERROR] Tried to get writeDescriptor from ' + this);
  }

  get isReader() {
    throw new Error('[ERROR] Tried to call isReader on ' + this);
  }

  get isWriter() {
    throw new Error('[ERROR] Tried to call isWriter on ' + this);
  }

  isDataLoaded() {
    throw new Error('[ERROR] Tried to call isDataLoaded on ' + this);
  }

  areAllLoaded() {
    throw new Error('[ERROR] Tried to call areAllLoaded on ' + this);
  }

  readData() {
    throw new Error('[ERROR] Tried to call readData on ' + this);
  }

  writeData() {
    throw new Error('[ERROR] Tried to call writeData on ' + this);
  }

  forEachNodeInSubTree() {
    throw new Error('[ERROR] Tried to call forEachNodeInSubTree on ' + this);
  }

  getReadDescendantByName() {
    throw new Error('[ERROR] Tried to call getReadDescendantByName on ' + this);
  }

  getWriteDescendantByName() {
    throw new Error('[ERROR] Tried to call getWriteDescendantByName on ' + this);
  }

  toString() {
    return `Ambiguous node "${this.name}", might refer to any of: [${this.fullNames.join(', ')}]`;
  }
}
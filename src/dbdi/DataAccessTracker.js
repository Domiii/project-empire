import { writeParameterConfig } from 'src/dbdi/DataWriteDescriptor';

import isObject from 'lodash/isObject';
import isPlainObject from 'lodash/isPlainObject';

import autoBind from 'src/util/auto-bind';

import { EmptyObject, EmptyArray } from 'src/util';

export default class DataAccessTracker {
  _dataSourceTree;
  _listener;
  _dataProviders = new Set();

  _injectProxy;
  _readersProxy;
  _writersProxy;

  _wrappedReaders = {};
  _wrappedWriters = {};

  constructor(dataSourceTree, listener) {
    this._dataSourceTree = dataSourceTree;
    this._listener = listener;

    autoBind(this);

    this._buildProxies();
  }

  // ################################################
  // Private methods + properties
  // ################################################

  _buildProxies() {
    this._injectProxy = new Proxy({}, this._buildReadByNameHandler());
    this._readersProxy = new Proxy({}, this._buildReadersByNameHandler());
  }

  _buildReadByNameHandler() {
    return {
      get: (target, name) => {
        // resolve node and return read data
        const readData = this.resolveReadDataForce(name);
        return readData && readData();
      }
    };
  }

  _buildReadersByNameHandler() {
    return {
      get: (target, name) => {
        // resolve node and return call function to caller.
        // let caller decide when to make the actual call and which arguments to supply.
        const readData = this.resolveReadDataForce(name);
        return readData;
      }
    };
  }

  _resolveArgumentHandler = {
    get: (target, name) => {
      if (target[name] === undefined) {
        console.warn(`Requested argument was not supplied: ${name}`);
      }
      return target[name];
    }
  };

  _wrapArgs(args, node) {
    if (args !== undefined && args !== null && !isPlainObject(args)) {
      let moreInfo = '';
      if (isObject(args)) {
        if (args.constructor) {
          moreInfo = 'object of type "' + args.constructor.name + '"';
        }
        else {
          moreInfo = `<object of unknown type>\n → keys: ${Object.keys(args)}`;
        }
      }
      else {
        moreInfo = args;
      }
      throw new Error(`Invalid arguments for data node "${node.fullName}"\n→ expected plain object but found: ` + 
        moreInfo + ' ←\n');
    }
    args = args || EmptyObject;
    return new Proxy(args, this._resolveArgumentHandler);
  }

  _wrapReadData(node) {
    const wrappedReadData = (args) => {
      return node.readData(this._wrapArgs(args, node), this._injectProxy, this._readersProxy, this);
    };

    wrappedReadData.isLoaded = (args) => {
      return node.isDataLoaded(this._wrapArgs(args, node), this._injectProxy, this._readersProxy, this);
    };

    return wrappedReadData;
  }

  _wrapWriteData(node) {
    const writeDescriptor = node.writeDescriptor;
    const paramConfig = writeParameterConfig[writeDescriptor.actionName];
    console.assert(paramConfig);
    const { processArguments } = paramConfig;

    return (...writeArgs) => {
      const allArgs = processArguments(node, writeArgs);
      allArgs.queryArgs = this._wrapArgs(allArgs.queryArgs, node);
      return node.writeData(allArgs, this._injectProxy, this._readersProxy, this);
    };
  }

  // ################################################
  // Public methods + properties
  // ################################################

  resolveReadData(name) {
    if (!this._dataSourceTree.hasReader(name)) {
      return undefined;
    }

    let readData = this._wrappedReaders[name];
    if (!readData) {
      const node = this._dataSourceTree.resolveReader(name);
      this._wrappedReaders[name] = readData =
        this._wrapReadData(node);
    }
    return readData;
  }

  /**
   * Throws error when reader of name does not exist
   */
  resolveReadDataForce(name) {
    const readData = this.resolveReadData(name);
    if (!readData) {
      throw new Error(`DI failed - reader does not exist: "${name}"`);
    }
    return readData;
  }

  resolveWriteData(name) {
    if (!this._dataSourceTree.hasWriter(name)) {
      //throw new Error(`DI failed - writer does not exist: "${name}"`);
      return undefined;
    }

    let writeData = this._wrappedWriters[name];
    if (!writeData) {
      const node = this._dataSourceTree.resolveWriter(name);
      this._wrappedWriters[name] = writeData = this._wrapWriteData(node);
    }
    return writeData;
  }

  recordDataAccess(dataProvider, path) {
    dataProvider.registerListener(path, this._listener);
    this._dataProviders.add(dataProvider);
  }

  unmount() {
    // reset all
    this._dataProviders.forEach(dataProvider => {
      dataProvider.unregisterListener(this._listener);
    });
    this._dataProviders = new Set();
  }
}
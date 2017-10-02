import forEach from 'lodash/forEach';

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
        const readData = this.resolveReadData(name);
        return readData && readData();
      }
    };
  }

  _buildReadersByNameHandler() {
    return {
      get: (target, name) => {
        // resolve node and return call function to caller.
        // let caller decide when to make the actual call and which arguments to supply.
        const readData = this.resolveReadData(name);
        return readData;
      }
    };
  }

  _wrapReadData(node) {
    const wrappedReadData = (args) => {
      return node.readData(args, this._injectProxy, this._readersProxy, this);
    };

    wrappedReadData.isLoaded = (args) => {
      return node.isDataLoaded(args, this._injectProxy, this._readersProxy, this);
    };

    return wrappedReadData;
  }

  _wrapWriteData(node) {
    return (args, val) => {
      return node.writeData(args, val, this._injectProxy, this._readersProxy, this);
    };
  }

  // ################################################
  // Public methods + properties
  // ################################################

  resolveReadData(name) {
    if (!this._dataSourceTree.hasReader(name)) {
      return null;
    }

    let readData = this._wrappedReaders[name];
    if (!readData) {
      const node = this._dataSourceTree.resolveReader(name);
      this._wrappedReaders[name] = readData =
        this._wrapReadData(node);
    }
    return readData;
  }

  resolveWriteData(name) {
    if (!this._dataSourceTree.hasWriter(name)) {
      return null;
    }

    let writeData = this._wrappedWriters[name];
    if (!writeData) {
      const node = this._dataSourceTree.resolveWriter(name);
      this._wrappedWriters[name] = writeData =
        this._wrapWriteData(node);
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
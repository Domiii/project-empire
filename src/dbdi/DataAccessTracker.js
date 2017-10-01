
import forEach from 'lodash/forEach';

export default class DataAccessTracker {
  _dataSourceTree;
  _dataSourceNode;
  _listener;
  _readerWrappers = new Map();
  _dataProviders = new Set();

  constructor(dataSourceTree, listener) {
    this._dataSourceTree = dataSourceTree;
    this._dataSourceNode = this._dataSourceTree._root;
    this._listener = listener;
  }

  _buildWrappedReader(readerNode) {
    const f = (...allArgs) => {
      //  1) set a contextTracker in DataSourceTree
      this._dataSourceTree.pushDataAccessRecords();

      //  2) call readData function
      const data = readerNode.readData(...allArgs);

      //  3) retrieve all accessed path
      const dataAccessRecords = this._dataSourceTree.popDataAccessRecords();

      // 4) call registerListener on each accessed path
      forEach(dataAccessRecords, record => {
        record.dataProvider.registerListener(record.path, this._listener);
        this._dataProviders.add(record.dataProvider);
      });
      return data;
    };
    f.isDataLoaded = readerNode.isDataLoaded;
    return f;
  }

  _getOrCreateWrappedReader(readerNode) {
    let reader = this._readerWrappers.get(readerNode);
    if (!reader) {
      this._readerWrappers.set(readerNode, reader = this._buildWrappedReader(readerNode));
    }
    return reader;
  }

  resolveReadData(name) {
    if (!this._dataSourceNode.hasReader(name)) {
      return null;
    }
    const readerNode = this._dataSourceNode.resolveReader(name);
    const wrappedReader = this._getOrCreateWrappedReader(readerNode);
    return wrappedReader;
  }

  resolveWriteData(name) {
    if (!this._dataSourceNode.hasWriter(name)) {
      return null;
    }
    // we don't need to keep track of writer requests
    return this._dataSourceNode.resolveWriter(name).writeData;
  }

  unmount() {
    // reset all
    this._dataProviders.forEach(dataProvider => {
      dataProvider.unregisterListener(this._listener);
    });
    this._readerWrappers = new Map();
    this._dataProviders = new Set();
  }
}
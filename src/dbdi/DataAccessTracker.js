
import forEach from 'lodash/forEach';

export default class DataAccessTracker {
  _dataSourceTree;
  _dataSourceNode;
  _onNewData;
  _readerWrappers = new Map();

  constructor(dataSourceTree, onNewData) {
    this._dataSourceTree = dataSourceTree;
    this._dataSourceNode = this._dataSourceTree._root;
    this._onNewData = onNewData;
  }

  _buildWrappedReader(readerNode) {
    return (...allArgs) => {
      //  1) set a contextTracker in DataSourceTree
      this._dataSourceTree.pushDataAccessRecords();

      //  2) call getData function
      const data = readerNode.getData(...allArgs);

      //  3) retrieve all accessed path
      const dataAccessRecords = this._dataSourceTree.popDataAccessRecords();

      // 4) call registerListener on each accessed path
      forEach(dataAccessRecords, record => {
        record.dataProvider.registerListener(record.path);
      });
      return data;
    };
  }

  _getOrCreateWrappedReader(readerNode) {
    let reader = this._readerWrappers.get(readerNode);
    if (!reader) {
      reader = this._readerWrappers.add(readerNode, this._buildWrappedReader(readerNode));
    }
    return reader;
  }

  resolveReader(name) {
    const reader = this._dataSourceNode.resolveReader(name);
    if (reader) {
      const wrappedReader = this._getOrCreateWrappedReader(reader);
      return wrappedReader();
    }
    return null;
  }

  resolveWriter(name) {
    // we don't need to keep track of writer requests
    return this._dataSourceNode.resolveWriter(name);
  }

  unmount() {
    // reset all
    // TODO: ???.unregisterListener(this._onNewData);
    _readerWrappers = new Map();
  }
}
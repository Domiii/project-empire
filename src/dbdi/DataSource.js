import autoBind from 'src/util/auto-bind';

function buildContextNodeBindings(dataSource, nodes) {

}

/**
 * Each DataSource has one DataSourceBindings object each for: 
 * 1) paths, 2) reads + 3) writes.
 * 
 * DataSourceBindings keeps track of the hierarchy, and provides the proxy objects
 * for all nodes in said tree.
 */
class DataSourceTreeBindings {
  _dataSource;
  _tree;
  _rootNodeBindings;

  constructor(dataSource, tree) {
    this._dataSource = dataSource;
    this._tree = tree;

    autoBind(this);

    this._buildNodeBindings();
  }

  _buildNodeBindings() {
    this._rootNodeBindings = buildContextNodeBindings(this._dataSource, this._tree._roots);
  }
}


// TODO: build tree of path nodes!
// TODO: build tree of read nodes!

// TODO: build reader nodes from path nodes
// TODO: build writer nodes from path nodes
// TODO: use to import old RefWrapper-style configs
// TODO: merge all nodes back into all ascendants when not ambiguous.
//    → if name is on this node, and the same name is used down the line, add the descriptor from "this node"
//    → in all other cases of ambiguity, insert "ambiguous error" descriptor

/**
 * A DataSource represents a (more or less) global object responsible
 * for providing data read + write operations to any part of your app that
 * is bound to it. It also shares data bindings between all read + write operations
 * that are bound to it.
 * 
 * A DataSource can be used globally in an application, or
 * different parts of the app can use different DataSources.
 */
export default class DataSource {
  _dataProviders;

  /**
   * The data bindings for building paths
   */
  _pathBindings;

  /**
   * The data bindings for reading data
   */
  _readBindings;

  /**
   * The data bindings for writing data
   */
  _writeBindings;


  constructor(dataProviders, dataSourceCfg) {
    this._dataProviders = dataProviders;
    this._buildDataSourceHierarchy(dataSourceCfg);
  }

  get paths() {
    return this._pathBindings;
  }

  get readers() {
    return this._readBindings;
  }

  get writers() {
    return this._writeBindings;
  }

  getDataProvider(name) {
    return this._dataProviders[name];
  }

  _buildDataSourceHierarchy() {
    // TODO: move through the config and create the hierarchy
    // TODO: merge all nodes back to all ascendants as long as they do not cause ambiguity
    // TODO: in case of ambiguity, if one node belongs to parent, let it stay
  }

}
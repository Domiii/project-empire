import autoBind from 'src/util/auto-bind';

function buildContextNodeBindings(dataContext, nodes) {
  
  }
  
  /**
   * Each DataContext has one DataContextBindings object each for: 
   * 1) paths, 2) reads + 3) writes.
   * 
   * DataContextBindings keeps track of the hierarchy, and provides the proxy objects
   * for all nodes in said tree.
   */
  class DataContextTreeBindings {
    _dataContext;
    _tree;
    _rootNodeBindings;
  
    constructor(dataContext, tree) {
      this._dataContext = dataContext;
      this._tree = tree;
  
      autoBind(this);
  
      this._buildNodeBindings();
    }
  
    _buildNodeBindings() {
      this._rootNodeBindings = buildContextNodeBindings(this._dataContext, this._tree._roots);
    }
  }
  

// TODO: build tree of path nodes!
// TODO: build tree of read nodes!
// TODO: build a merger of the two trees! 
  
  /**
   * A DataContext represents a (more or less) global object responsible
   * for providing data read + write operations to any part of your app that
   * is bound to it. It also shares data bindings between all read + write operations
   * that are bound to it.
   * 
   * A DataContext can be used globally in an application, or
   * different parts of the app can use different DataContexts.
   */
  class DataContext {
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
  
  
    constructor(dataProviders, dataAccessCfg) {
      this._dataProviders = dataProviders;
      this._buildDataSourceHierarchy(dataAccessCfg);
    }
  
    getDataProvider(name) {
      return this._dataProviders[name];
    }
    
    _buildDataSourceHierarchy() {
      return new Datasourcetre
    }
  
  }
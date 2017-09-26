import autoBind from 'src/util/auto-bind';

import { EmptyObject, EmptyArray } from 'src/util';

// TODO: let all data path/read/write nodes of the same name easily access each other

/**
 * The DataSourceNode provides access to a specific name in the data hierarchy 
 * through di (dependency injection) proxies and is at the core of the data model.
 * The node has access to all the named nodes that it's users could possibly make use of.
 * The node then uses the descriptor function while providing data from the bound data providers.
 */
export default class DataSourceNode {
  _dataSource;
  _dataProvider;
  _descriptor;

  _readByNameProxy;
  _readersByNameProxy;
  _writersByNameProxy;
  
  _sourceNodesByName;

  constructor(dataSource, descriptorNode) {
    this._dataSource = dataSource;
    this._descriptor = descriptorNode;
    this._dataProvider = dataSource.dataProviders[descriptorNode.dataProviderName];

    autoBind(this);

    this._buildProxies();
    this._buildChildBindings();
    
    console.assert(this._dataProvider);
  }


  // ################################################
  // Private methods
  // ################################################

  _buildProxies() {
    this._readersByNameProxy = new Proxy({}, this._buildReadersByNameHandler);
    this._readByNameProxy = new Proxy({}, this._buildReadByNameHandler);
  }

  _buildReadersByNameHandler() {
    return {
      get: (target, name) => {
        // resolve node and return call function to caller.
        // let caller decide when to make the actual call and which arguments to supply.
        const node = this.resolveName(name);
        // TODO: call function also needs "isLoaded" (and other data-related) meta properties?
        return node.call;
      }
    };
  }

  _buildReadByNameHandler() {
    return {
      get: (target, name) => {
        // resolve node and make call as soon as it's accessed
        const node = this.resolveName(name);
        return node.call();
      }
    };
  }

  _buildChildBindings() {
    // TODO
    this._sourceNodesByName = eyyyy;
  }


  // ################################################
  // Public properties + methods
  // ################################################

  get name() {
    return this._descriptor.name;
  }

  // isNameLoaded(sourceName, args) {
  //   const node = this.resolveName(sourceName);
  //   if (!node) {
  //     throw new Error('invalid node name: ' + sourceName);
  //   }
  //   return !node.isDataLoaded(args);
  // }

  resolveName(name) {
    const node = this._sourceNodesByName[name];
    if (!node) {
      throw new Error(`Requested name "${name}" does not exist in "${this.name}"`);
    }
    return node;
  }

  execute(args) {
    args = args || EmptyObject;
    return this._descriptor.execute(args, this._readByNameProxy, this._readersByNameProxy);
  }
}
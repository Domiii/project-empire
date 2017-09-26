import { parseConfig } from './DataSourceConfig';
import PathDescriptor from './PathDescriptor';
import DataReadDescriptor from './DataReadDescriptor';
import DataWriteDescriptor from './DataWriteDescriptor';

import forEach from 'lodash/forEach';

import autoBind from 'src/util/auto-bind';


// TODO: merge most of this into DataSourceNode

// TODO: build reader nodes from path nodes
// TODO: build writer nodes from path nodes
// TODO: use to import old RefWrapper-style configs
// TODO: merge all nodes back into all ascendants when not ambiguous.
//    → if name is on this node, and the same name is used down the line, add the descriptor from "this node"
//    → in all other cases of ambiguity, insert "ambiguous error" descriptor

/**
 * A DataSource is responsible for providing data read + write operations to any part of your app.
 * 
 * In React, a DataSource is injected into the context through the DataSourceProvider component.
 * It uses a pub-sub model to keep track of data updates.
 */
export default class DataSourceTree {
  _dataProviders;

  /**
   * The data bindings for building paths
   */
  _pathRoot;

  /**a
   * The data bindings for reading data
   */
  _readRoot;

  /**
   * The data bindings for writing data
   */
  _writeRoot;


  constructor(dataProviders, dataSourceCfgRaw) {
    this._dataProviders = dataProviders;
    this._dataSourceCfg = parseConfig(dataSourceCfgRaw);

    autoBind(this);

    this._buildDataSourceHierarchy(null, this._dataSourceCfg);
  }


  // ################################################
  // Private methods
  // ################################################

  _buildDataSourceHierarchy(parent, childrenConfig) {
    
          // TODO: Finish the hierarchy!
          
    // TODO: move through the config and create the hierarchy
    // TODO: merge all nodes back to all ascendants as long as they do not cause ambiguity
    // TODO: in case of ambiguity, if one node belongs to parent, let it stay
    forEach(childrenConfig, configNode => {
      const dataProvider = this._dataProviders[configNode.dataProviderName];
      const pathDescriptor = new PathDescriptor(configNode.pathConfig);
      const newSourceNode = new DataSourceNode(parent, descriptorNode, dataProvider);
    });
  }


  // ################################################
  // Public methods + properties
  // ################################################

  get paths() {
    return this._pathRoot;
  }

  get readers() {
    return this._readRoot;
  }

  get writers() {
    return this._writeRoot;
  }

  getDataProvider(name) {
    return this._dataProviders[name];
  }
}
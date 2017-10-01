import { parseConfig } from './DataSourceConfig';
import PathDescriptor from './PathDescriptor';
import DataReadDescriptor from './DataReadDescriptor';
import DataWriteDescriptor from './DataWriteDescriptor';
import DataSourceNode, { AmbiguousSourceNode } from './DataSourceNode';

import forEach from 'lodash/forEach';
import mapValues from 'lodash/mapValues';
import pickBy from 'lodash/pickBy';
import last from 'lodash/last';

import autoBind from 'src/util/auto-bind';

import { EmptyObject, EmptyArray } from 'src/util';

// TODO: use to import old RefWrapper-style configs

/**
 * A DataSource is responsible for providing data read + write operations to any part of a web app.
 * 
 * In React, a DataSource is injected into the context through the DataSourceProvider component.
 * It uses a pub-sub model to keep track of data updates.
 */
export default class DataSourceTree {
  _dataProviders;

  /**
   * All DataSourceNodes
   */
  _root;

  _dataAccessRecords = [];


  constructor(dataProviders, dataSourceCfgRaw) {
    this._dataProviders = dataProviders;
    this._dataSourceCfgRoot = parseConfig(dataSourceCfgRaw);

    autoBind(this);

    this._root = this._buildNode(null, this._dataSourceCfgRoot, '');

    this._compressHierarchy(this._root);
  }

  _buildNode(parent, configNode, name) {
    const dataProvider = this._dataProviders[configNode.dataProviderName];
    const fullName = (parent && parent.fullName && (parent.fullName + '.') || '') + name;
    const pathDescriptor = configNode.pathConfig && new PathDescriptor(configNode.pathConfig, fullName);
    const readCfg = pathDescriptor || configNode.reader;
    const readDescriptor = readCfg && new DataReadDescriptor(readCfg, fullName);
    const newNode = new DataSourceNode(
      this, parent,
      dataProvider, 
      name, fullName, 
      pathDescriptor, 
      readDescriptor, null);

    newNode._children = this._buildDataReadNodes(newNode,
      Object.assign(
        {}, 
        configNode.children || EmptyObject, 
        configNode.readers || EmptyObject
      )
    );

    //this._buildDataWriteNodes(sourceNode, this._dataSourceCfgRoot);

    return newNode;
  }

  _buildDataReadNodes(parent, cfgChildren) {
    return mapValues(cfgChildren, (configNode, name) => {
      if (!configNode) return null;

      return this._buildNode(parent, configNode, name);
    });
  }

  // _makeWriteData(cfg) {
  //   if (cfg instanceof PathDescriptor) {
  //     // build writer from pathDescriptor
  //     writeData = this._build...FromDescriptor(cfg);
  //   }
  //   else if (isFunction(cfg)) {
  //     // custom reader function
  //     writeData = cfg;
  //   }
  //   else {
  //     throw new Error('Could not make sense of DataWriteDescriptor config node: ' + JSON.stringify(cfg));
  //   }
  //   return this._wrapAccessFunction(writeData);
  // }

  _buildDataWriteNodes(parent, cfgChildren) {
    // forEach(cfgChildren, configNode => {
    //   if (!configNode) return null;


    //   const dataProvider = writeNode._dataProvider;
    //   const pathDescriptor = writeNode._pathDescriptor;

    //   // TODO: multiple writer nodes per name/path
    //   const writeFn = this._makeWriteFn(pathDescriptor || configNode.writer);
    //   const writeDescriptor = new DataWriteDescriptor(...);
    //   const newNode = new DataSourceNode(this, writeNode, dataProvider, name, pathDescriptor, null, writeDescriptor);

    //   newNode._children = _buildDataSourceHierarchy(newNode, 
    //     Object.assign({}, configNode.children, configNode.writers || EmptyObject));
    //
    //   const writerChildren = pickBy(newNode._children, childNode => childNode.isWriter);
    //   newNode._writeDescendants = Object.assign({}, newNode._writeDescendants, writerChildren);
    //   return newNode;
    // });
  }


  // ################################################
  // Private methods
  // ################################################

  _addDescendants(descendants, childDescendants) {
    forEach(childDescendants, (descendant, name) => {
      if (!descendants[name]) {
        descendants[name] = descendant;
      }
      else {
        // ambiguous!
        const originalNode = descendants[name];
        let ambiguousNode;
        if (!(originalNode instanceof AmbiguousSourceNode)) {
          descendants[name] = ambiguousNode = new AmbiguousSourceNode(name, originalNode.fullName);
        }
        else {
          ambiguousNode = originalNode;
        }
        ambiguousNode.fullNames.push(descendant.fullName);
      }
    });
  }

  _addImmediateDescendants(descendants, node, filter) {
    // immediate children always have top priority
    // override any other node in case of ambiguity
    const children = pickBy(node._children, filter);
    Object.assign(descendants, children);
  }

  _compressHierarchy(node) {
    const readDescendants = {};
    forEach(node._children, child => {
      // recurse first
      this._compressHierarchy(child);

      // on the way back up, build sets of descendants
      this._addDescendants(readDescendants, child._readDescendants);
    });

    // merge immediate children into descendants separately
    this._addImmediateDescendants(readDescendants, node, childNode => childNode.isReader);
    node._readDescendants = readDescendants;
  }

  _recordDataAccess(dataProvider, path) {
    console.assert(dataProvider && path);

    const records = last(this._dataAccessRecords);
    if (!records) {
      console.error(`Invalid data access on "${path}" - ` +
        'Did not call push pushDataAccessRecords first.');
    }
    else {
      records.push({ dataProvider, path });
    }
  }

  // ################################################
  // Public methods + properties
  // ################################################

  get root() {
    return this._root;
  }

  getDataProvider(name) {
    return this._dataProviders[name];
  }

  pushDataAccessRecords() {
    this._dataAccessRecords.push([]);
  }

  popDataAccessRecords() {
    return this._dataAccessRecords.pop();
  }
}
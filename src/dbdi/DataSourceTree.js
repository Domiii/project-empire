import { parseConfig } from './DataStructureConfig';
import PathDescriptor from './PathDescriptor';
import DataReadDescriptor from './DataReadDescriptor';
import DataWriteDescriptor from './DataWriteDescriptor';
import DataSourceNode, { AmbiguousSourceNode } from './DataSourceNode';

import forEach from 'lodash/forEach';
import map from 'lodash/map';
import mapValues from 'lodash/mapValues';
import pickBy from 'lodash/pickBy';
import zipObject from 'lodash/zipObject';

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

  constructor(dataProviders, dataStructureCfgRaw) {
    this._dataProviders = dataProviders;
    this._dataStructureCfgRoot = parseConfig(dataStructureCfgRaw);

    autoBind(this);

    this._root = this._buildNodeWithChildren(this._dataStructureCfgRoot, null, '');

    this._compressHierarchy(this._root);
  }

  _buildNodeWithChildren(configNode, ...moreArgs) {
    const newDataNode = this._buildNode(configNode, ...moreArgs);
    this._buildChildren(newDataNode, configNode);
    return newDataNode;
  }

  _buildChildren(newDataNode, configNode) {
    const children = Object.assign({},
      this._buildAdditionalDataReadNodes(newDataNode, configNode.readers),
      this._buildAdditionalDataWriteNodes(newDataNode, configNode.writers),

      this._buildHybridDataNodes(newDataNode, configNode.children)
    );

    newDataNode._children = children;
  }

  _buildNode(configNode, parent, name, buildDataReadDescriptor, buildDataWriteDescriptor) {
    const dataProvider = this._dataProviders[configNode.dataProviderName];
    const fullName = (parent && parent.fullName && (parent.fullName + '.') || '') + name;
    const pathDescriptor = configNode.pathConfig && new PathDescriptor(configNode.pathConfig, fullName);

    return new DataSourceNode(
      this, parent, dataProvider,
      name, fullName,
      pathDescriptor,
      buildDataReadDescriptor && buildDataReadDescriptor(fullName, configNode, pathDescriptor),
      buildDataWriteDescriptor && buildDataWriteDescriptor(fullName, configNode, pathDescriptor)
    );
  }

  _buildDataReadDescriptor(fullName, configNode, pathDescriptor) {
    const readCfg = configNode.reader || pathDescriptor;
    const readDescriptor = readCfg && new DataReadDescriptor(readCfg, fullName);
    return readDescriptor;
  }

  _buildHybridDataNodes(parent, cfgChildren) {
    // nodes that potentially have both readers and writers
    const newNodes = {};
    forEach(cfgChildren, (configNode, name) => {
      if (configNode.pathConfig) {
        // add default writers at path
        forEach(this._defaultDataWriteDescriptorBuilders, (descriptorBuilder, writerName) => {
          this._addDataWriteNode(configNode, parent, writerName + '_' + name, descriptorBuilder, newNodes);
        });
      }

      // build node
      const newDataNode = newNodes[name] = this._buildNode(configNode, parent, name,
        this._buildDataReadDescriptor,
        this._dataWriteCustomBuilder);

      // recurse
      this._buildChildren(newDataNode, configNode);
    });
    return newNodes;
  }

  _buildAdditionalDataReadNodes(parent, cfgChildren) {
    return mapValues(cfgChildren, (configNode, name) => {
      const newDataNode = this._buildNode(configNode, parent, name, this._buildDataReadDescriptor);
      return newDataNode;
    });
  }

  _defaultWriteOps = ['push', 'set', 'update', 'delete']

  _buildMetaWriteCfg(configNode, actionName) {
    const { onWrite } = configNode;
    return {
      actionName,
      onWrite: onWrite
    };
  }

  _defaultDataWriteDescriptorBuilders = zipObject(this._defaultWriteOps, 
    map(this._defaultWriteOps, (actionName) =>
      (fullName, configNode, pathDescriptor) => {
        const metaCfg = this._buildMetaWriteCfg(configNode, actionName);
        return pathDescriptor && new DataWriteDescriptor(pathDescriptor, metaCfg, fullName);
      }
    )
  )

  _dataWriteCustomBuilder(fullName, configNode, _) {
    const metaCfg = this._buildMetaWriteCfg(configNode, 'custom');
    return configNode.writer && new DataWriteDescriptor(configNode.writer, metaCfg, fullName);
  }


  _addDataWriteNode(configNode, parent, name, descriptorBuilder, newChildren) {
    const newDataNode = this._buildNode(
      configNode, parent, name,
      null, descriptorBuilder);

    newChildren[name] = newDataNode;
  }

  _buildAdditionalDataWriteNodes(parent, cfgChildren) {
    const newChildren = {};
    forEach(cfgChildren, (configNode, name) => {
      this._addDataWriteNode(configNode, parent, name, this._dataWriteCustomBuilder, newChildren);
    });
    return newChildren;
  }

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
    const writeDescendants = {};
    forEach(node._children, child => {
      // recurse: compress children first
      this._compressHierarchy(child);

      // on the way back up, build sets of descendants
      this._addDescendants(readDescendants, child._readDescendants);
      this._addDescendants(writeDescendants, child._writeDescendants);
    });

    // merge immediate children into node's descendant sets
    this._addImmediateDescendants(readDescendants, node, childNode => childNode.isReader);
    node._readDescendants = readDescendants;

    this._addImmediateDescendants(writeDescendants, node, childNode => childNode.isWriter);
    node._writeDescendants = writeDescendants;
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

  // isNameLoaded(sourceName, args) {
  //   const node = this.resolveName(sourceName);
  //   if (!node) {
  //     throw new Error('invalid node name: ' + sourceName);
  //   }
  //   return !node.isDataLoaded(args);
  // }

  hasReader(name) {
    return !!this._root._readDescendants[name];
  }

  hasWriter(name) {
    return !!this._root._writeDescendants[name];
  }

  resolveReader(name) {
    const node = this._root._readDescendants[name];
    if (!node) {
      console.error(`Requested reader "${name}" does not exist in DataSourceTree - ` +
        '(' + Object.keys(this._root._readDescendants).join(', ') + ')');
    }
    return node;
  }

  resolveWriter(name) {
    const node = this._root._writeDescendants[name];
    if (!node) {
      console.error(`Requested writer "${name}" does not exist in DataSourceTree - ` +
        '(' + Object.keys(this._root._writeDescendants).join(', ') + ')');
    }
    return node;
  }
}
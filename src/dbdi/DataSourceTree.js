import { parseConfig } from './DataStructureConfig';
import PathDescriptor from './PathDescriptor';
import DataReadDescriptor from './DataReadDescriptor';
import DataWriteDescriptor from './DataWriteDescriptor';
import DataSourceNode, { AmbiguousSourceNode } from './DataSourceNode';

import isArray from 'lodash/isArray';
import isString from 'lodash/isString';
import isFunction from 'lodash/isFunction';
import forEach from 'lodash/forEach';
import map from 'lodash/map';
import mapValues from 'lodash/mapValues';
import pickBy from 'lodash/pickBy';
import zipObject from 'lodash/zipObject';

import autoBind from 'src/util/auto-bind';

import { EmptyObject, EmptyArray } from 'src/util';

/**
 * A DataSource is responsible for providing data read + write operations to any part of a web app.
 * 
 * In React, a DataSource is injected into the context through the DataSourceProvider component.
 * It uses a pub-sub model to keep track of data updates.
 */
export default class DataSourceTree {
  _dataProviders;

  _plugins;

  /**
   * All DataSourceNodes
   */
  _root;

  constructor(dataProviders, dataStructureCfgRaw, plugins) {
    this._dataProviders = dataProviders;
    this._dataStructureCfgRoot = parseConfig(dataStructureCfgRaw);
    this._plugins = plugins;

    autoBind(this);

    this._root = this._buildNodeWithChildren(this._dataStructureCfgRoot, null, '');

    this._compressHierarchy(this._root);
  }

  // #########################################################################
  // Public methods + properties
  // #########################################################################

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

  getPlugins(type) {
    return this._plugins[type];
  }

  getPlugin(type, readerOrPluginName) {
    if (isFunction(readerOrPluginName)) {
      return readerOrPluginName;
    }
    else if (isString(readerOrPluginName)) {
      const name = readerOrPluginName;
      const plugins = this.getPlugins(type);
      const plugin = plugins && plugins[name];
      if (!plugin) {
        throw new Error(`Could not find plugin of type "${type}" and name "${name}"`);
      }
      return plugin;
    }
    else {
      throw new Error(`Invalid config entry of type "${type}" must be function or string: ` +
        readerOrPluginName);
    }
  }

  // #########################################################################
  // Private methods + properties
  // #########################################################################

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
    let { reader } = configNode;
    reader = reader && this.getPlugin('reader', reader);
    const readDescriptor = (reader || pathDescriptor) &&
      new DataReadDescriptor(pathDescriptor, reader, fullName);
    return readDescriptor;
  }

  _buildDataReadForceDescriptor(fullName, configNode, pathDescriptor) {
    const origDescriptor = this._buildDataReadDescriptor(fullName, configNode, pathDescriptor);
    const reader = (...allArgs) => {
      if (!origDescriptor.isDataLoaded(...allArgs)) {
        throw new Error('Force read failed. Data not loaded yet at data node: ' + fullName);
      }
      return origDescriptor.readData(...allArgs);
    };
    return new DataReadDescriptor(null, reader, fullName);
  }

  _buildDataIsLoadedReadDescriptor(fullName, configNode, pathDescriptor) {
    const origDescriptor = this._buildDataReadDescriptor(fullName, configNode, pathDescriptor);
    const reader = (...allArgs) => {
      return origDescriptor.isDataLoaded(...allArgs);
    };
    return new DataReadDescriptor(null, reader, fullName);
  }

  _buildHybridDataNodes(parent, cfgChildren) {
    // nodes that potentially have both readers and writers
    const newNodes = {};
    forEach(cfgChildren, (configNode, name) => {
      if (configNode.pathConfig) {
        // add default writers at path
        this._buildDefaultWriters(configNode, parent, name, newNodes);
      }

      // build node
      const newDataNode = newNodes[name] = this._buildNode(configNode, parent, name,
        this._buildDataReadDescriptor,
        this._dataWriteCustomBuilder);

      if (newDataNode.isReader) {
        // also register under the "get_*" alias
        let readerName = 'get_' + name;
        newNodes[readerName] = this._buildNode(configNode, parent, readerName,
          this._buildDataReadDescriptor,
          null);

        // add isLoaded node
        readerName = name + '_isLoaded';
        newNodes[readerName] = this._buildDataReadDescriptor && this._buildNode(
          configNode, parent, readerName,
          this._buildDataIsLoadedReadDescriptor,
          null);

        // add the "force_*" reader
        readerName = 'force_' + name;
        newNodes[readerName] = this._buildNode(configNode, parent, readerName,
          this._buildDataReadForceDescriptor,
          null);
      }

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

  // #########################################################################
  // Handle Writers
  //
  // TODO: move (most of) this out of here. It is DataProvider dependent.
  // #########################################################################

  _defaultWriteOps = ['push', 'set', 'update', 'delete']

  _customWritePathDescriptors = {
    push(pathDescriptor, name) {
      return pathDescriptor.buildParentPathDescriptor(name);
    }
  }

  _buildDefaultWriters(configNode, parent, name, newNodes) {
    forEach(this._defaultDataWriteDescriptorBuilders, (descriptorBuilder, writerName) => {
      this._addDataWriteNode(configNode, parent, writerName + '_' + name, descriptorBuilder, newNodes);
    });
  }

  _buildMetaWriteCfg(configNode, actionName) {
    let { onWrite } = configNode;

    if (isArray(onWrite)) {
      // get final set of functions for each function
      const fns = map(onWrite, cfg => this.getPlugin('onWrite', cfg));

      // nest function calls
      onWrite = (...args) => {
        for (let i = 0; i < fns.length; ++i) {
          fns[i](...args);
        }
      };
    }
    else {
      onWrite = onWrite && this.getPlugin('onWrite', onWrite);
    }

    return {
      actionName,
      onWrite
    };
  }

  /**
   * functions to create DataWriteScriptor for each write action.
   */
  _defaultDataWriteDescriptorBuilders = zipObject(this._defaultWriteOps,
    map(this._defaultWriteOps, (actionName) =>
      (fullName, configNode, pathDescriptor) => {
        const metaCfg = this._buildMetaWriteCfg(configNode, actionName);
        const customPathDescriptorBuilder = this._customWritePathDescriptors[actionName];
        if (customPathDescriptorBuilder) {
          // push has a special path
          pathDescriptor = customPathDescriptorBuilder(pathDescriptor, fullName);
        }
        return new DataWriteDescriptor(pathDescriptor, metaCfg, fullName);
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

    return newChildren[name] = newDataNode;
  }

  _buildAdditionalDataWriteNodes(parent, cfgChildren) {
    const newChildren = {};
    forEach(cfgChildren, (configNode, name) => {
      this._addDataWriteNode(configNode, parent, name, this._dataWriteCustomBuilder, newChildren);
    });
    return newChildren;
  }


  // #########################################################################
  // Descendant management + hierarchy compression
  // #########################################################################

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
}
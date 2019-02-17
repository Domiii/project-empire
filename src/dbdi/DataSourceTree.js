import { parseConfig, parseConfigChildren } from './DataStructureConfig';
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
import merge from 'lodash/merge';

import autoBind from 'src/util/auto-bind';

//import { EmptyObject, EmptyArray } from 'src/util';

import DataAccessTracker from './DataAccessTracker';


/**
 * For now, we just add the default plugins.
 * Eventually, we can easily put them into separate NPM modules.
 * (because there is no specialized code outside of the plugins referring to the plugins)
 */
import { DataRelationshipPlugin } from './plugins/DataRelationshipGraph';
function addDefaultPlugins(plugins) {
  merge(plugins, {
    // invoked via: this._notifyPlugins('tree', this);
    tree: [
      DataRelationshipPlugin
    ]
  });
}

/**
 * @returns {DataSourceTree}
 */
export default function buildSourceTree(dataProviders, dataStructureCfgRaw, plugins) {
  plugins = plugins || {};

  addDefaultPlugins(plugins);

  const tree = new DataSourceTree(dataProviders, dataStructureCfgRaw, plugins);
  tree._buildTree();
  return tree;
}

/**
 * A DataSource is responsible for providing data read + write operations to any part of a web app.
 * 
 * In React, a DataSource is injected into the context through the DataSourceProvider component.
 * It uses a pub-sub model to keep track of data updates.
 */
class DataSourceTree {
  _dataProviders;

  _plugins;
  _pluginInstances = {};

  /**
   * All DataSourceNodes
   */
  _root;

  constructor(dataProviders, dataStructureCfgRaw, plugins) {
    this._dataProviders = dataProviders;
    this._dataStructureCfgRoot = parseConfig(dataStructureCfgRaw);
    this._plugins = plugins;

    autoBind(this);
  }

  // #########################################################################
  // public book keeping
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
  getNodeByName(name) {
    if (this.hasReader(name)) {
      return this.resolveReader(name);
    }
    if (this.hasWriter(name)) {
      return this.resolveWriter(name);
    }
    return null;
  }

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

  getAllReaderNames() {
    return Object.keys(this._root._readDescendants);
  }

  getAllWriterNames() {
    return Object.keys(this._root._writeDescendants);
  }

  _notifyPlugins(type, ...args) {
    // TODO: replace with event engine instead?
    //console.warn('DataSourceTree._notifyPlugins', type);

    const plugins = this.getPlugins(type);
    if (plugins) {
      if (isFunction(plugins)) {
        const pluginFn = plugins;
        this._notifyPlugin(type, pluginFn, ...args);
      }
      else if (isArray(plugins)) {
        forEach(plugins, pluginFn => this._notifyPlugin(type, pluginFn, ...args));
      }
      else {
        throw new Error(`invalid plugin(s) of type '${type}' must be function or array of function: ${plugins}`);
      }
    }
  }

  _notifyPlugin(type, pluginFn, ...args) {
    try {
      const res = pluginFn(...args);
      if (res !== undefined) {
        const arr = this._pluginInstances[type] || (this._pluginInstances[type] = []);
        arr.push(res);
      }
    }
    catch (err) {
      throw new Error(`ERROR when executing plugin of type '${type}' - ` + err.stack);
    }
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
  // Methods for modifying the tree
  // #########################################################################

  /**
   * WARNING: This does not perform a merge. Replaces any existing nodes in the hierarchy in case of name conflict.
   */
  addChildrenToRoot(childrenCfgRaw) {
    const root = this._root;
    //const childrenCfg = parseConfigChildren(root.cfg, childrenCfgRaw);
    const childrenCfg = parseConfigChildren(null, childrenCfgRaw);
    const newChildren = this._buildChildren(root, childrenCfg); // build
    this._addChildrenToNode(root, newChildren); // add

    return newChildren;
  }

  addChildToRoot(name, childCfgRaw) {
    this.addChildrenToRoot({ [name]: childCfgRaw });
  }

  // #########################################################################
  // Tree construction
  // #########################################################################

  _buildTree() {
    const cfg = this._dataStructureCfgRoot;

    // build tree
    this._root = this._buildRoot(cfg);

    // add special nodes
    this._addSpecialNodes();

    // we need to compress once s.t. that plugins (such as DataRelationshipGraph) get full tree functionality
    this._compressHierarchy(this._root);

    // add relationships and do other plugin stuff
    this._notifyTreeBuilt();

    // we need to compress a second time because plugins (such as DataRelationshipGraph) 
    //    might have added new nodes that are yet compressed
    this._compressHierarchy(this._root);
  }

  _addSpecialNodes() {
    this.addChildrenToRoot({
      // special node: get instance of the tree itself
      _tree: {
        reader: () => {
          return this;
        }
      },

      _rawDataProviderAction: {
        writer: ({dataProvider: dataProviderName, action, remotePath, val}) => {
          const dataProvider = this._dataProviders[dataProviderName];
          if (!dataProvider) {
            throw new Error('invalid dataProviderName: ' + dataProviderName);
          }
          if (!dataProvider.actions[action]) {
            throw new Error('invalid actionName: ' + action);
          }
          return dataProvider.actions[action](remotePath, val);
        }
      }
    });
  }

  _notifyTreeBuilt() {
    this._notifyPlugins('tree', this);
  }

  /**
   * Build the given node, as well as all readers/writers/children
   */
  _buildRoot(configNode) {
    const newDataNode = this._buildNodeOnly(configNode, null, '', null, null);
    this._buildAllDescendants(newDataNode, configNode);
    return newDataNode;
  }

  /**
   * Build readers/writers/children and add to existing node
   */
  _buildAllDescendants(dataNode, configNode) {
    const newChildren = Object.assign(
      this._buildReaders(dataNode, configNode.readers),
      this._buildWriters(dataNode, configNode.writers),
      this._buildChildren(dataNode, configNode.children)
    );

    // assign to _children
    this._addChildrenToNode(dataNode, newChildren);

    return newChildren;
  }

  _addChildrenToNode(dataNode, dataChildNodes) {
    dataNode._children = dataNode._children || {};
    Object.assign(dataNode._children, dataChildNodes);
  }

  /**
   * Create new node
   */
  _buildNodeOnly(configNode, parent, name, buildDataReadDescriptor, buildDataWriteDescriptor) {
    const dataProvider = this._dataProviders[configNode.dataProviderName];
    if (configNode.dataProviderName && !dataProvider) {
      throw new Error(`Invalid dataProvider does not exist in node "${name}": "${configNode.dataProviderName}"`);
    }
    const fullName = (parent && parent.fullName && (parent.fullName + '.') || '') + name;
    const pathDescriptor = configNode.pathConfig &&
      new PathDescriptor(parent && parent.pathDescriptor, configNode.pathConfig, fullName);

    return new DataSourceNode(
      this, configNode, parent, dataProvider,
      name, fullName,
      pathDescriptor,
      buildDataReadDescriptor && buildDataReadDescriptor(fullName, configNode, pathDescriptor),
      buildDataWriteDescriptor && buildDataWriteDescriptor(fullName, configNode, pathDescriptor)
    );
  }

  _buildDataReadDescriptor(fullName, configNode, pathDescriptor) {
    let { reader, fetch } = configNode;
    reader = reader && this.getPlugin('reader', reader);
    const isReader = reader || pathDescriptor;
    const readDescriptor = isReader && new DataReadDescriptor(pathDescriptor, reader, fetch, fullName);
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
    const { fetch } = origDescriptor;
    return new DataReadDescriptor(null, reader, fetch, fullName);
  }

  _buildDataIsLoadedReadDescriptor(fullName, configNode, pathDescriptor) {
    const origDescriptor = this._buildDataReadDescriptor(fullName, configNode, pathDescriptor);
    const reader = (...allArgs) => {
      return origDescriptor.isDataLoaded(...allArgs);
    };
    const { fetch } = origDescriptor;
    return new DataReadDescriptor(null, reader, fetch, fullName);
  }

  _buildChildren(parent, cfgChildren) {
    // nodes that potentially have both readers and writers
    const newNodes = {};
    forEach(cfgChildren, (configNode, name) => {
      // build node (actual buildNode() call)
      const newDataNode = newNodes[name] = this._buildNodeOnly(configNode, parent, name,
        this._buildDataReadDescriptor,
        this._buildCustomDataSetDescriptor);

      // HACKFIX: there is certain properties of the original configNode that derivatives should not hang on to
      configNode = { ...configNode };
      delete configNode.hasMany;

      if (configNode.pathConfig) {
        // build default writers at path
        this._buildDefaultWriters(configNode, parent, name, newNodes);
      }
      else if (newDataNode.isWriter) {
        // has no path, but has custom writer
        const writerName = 'set_' + name;
        this._buildDataWriteNode(configNode, parent, writerName,
          this._buildCustomDataSetDescriptor, newNodes);
      }

      if (newDataNode.isReader) {
        // also register under the "get_*" alias
        let readerName = 'get_' + name;
        newNodes[readerName] = this._buildNodeOnly(configNode, parent, readerName,
          this._buildDataReadDescriptor,
          null);

        // add isLoaded node
        readerName = name + '_isLoaded';
        newNodes[readerName] = this._buildDataReadDescriptor && this._buildNodeOnly(
          configNode, parent, readerName,
          this._buildDataIsLoadedReadDescriptor,
          null);

        // add the "force_*" reader
        readerName = 'force_' + name;
        newNodes[readerName] = this._buildNodeOnly(configNode, parent, readerName,
          this._buildDataReadForceDescriptor,
          null);
      }

      // recurse
      this._buildAllDescendants(newDataNode, configNode);
    });
    return newNodes;
  }

  _buildReaders(parent, readers) {
    return mapValues(readers, (configNode, name) => {
      const newDataNode = this._buildNodeOnly(configNode, parent, name, this._buildDataReadDescriptor, null);
      return newDataNode;
    });
  }

  // #############################################
  // Handle Writers
  //
  // TODO: Consider moving DataProvider-dependent stuff outta here
  // ##############################################

  _defaultWriteOps = ['push', 'set', 'update', 'delete']

  _customWritePathDescriptors = {
    push(pathDescriptor) {
      return pathDescriptor.getParentPathDescriptor();
    }
  }

  _buildDefaultWriters(configNode, parent, name, newNodes) {
    forEach(this._defaultDataWriteDescriptorBuilders, (descriptorBuilder, writerName) => {
      this._buildDataWriteNode(configNode, parent, writerName + '_' + name, descriptorBuilder, newNodes);
    });
  }

  _buildMetaWriteCfg(configNode, actionName, eventName) {
    let onWrite = configNode[eventName];

    if (isArray(onWrite)) {
      // get final set of functions for each function
      const fns = map(onWrite, cfg => this.getPlugin(eventName, cfg));

      // nest function calls
      onWrite = (...args) => {
        for (let i = 0; i < fns.length; ++i) {
          fns[i](...args);
        }
      };
    }
    else {
      onWrite = onWrite && this.getPlugin(eventName, onWrite);
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
      (fullName, _configNode, pathDescriptor) => {
        let configNode;
        if (actionName === 'set' && _configNode.writer) {
          // custom settings
          // TODO: this is not handled very well now is it...
          configNode = _configNode.writer;
        }
        else {
          configNode = _configNode;
        }

        const metaCfg = this._buildMetaWriteCfg(configNode, actionName, 'onWrite');
        const customPathDescriptorBuilder = this._customWritePathDescriptors[actionName];
        if (customPathDescriptorBuilder) {
          // push has a special path
          pathDescriptor = customPathDescriptorBuilder(pathDescriptor);
          if (!pathDescriptor) {
            // this path does not have a sensical writer for this action (e.g. pushing to root)
            return null;
          }
        }
        return new DataWriteDescriptor(pathDescriptor, metaCfg, fullName);
      }
    )
  )

  _buildCustomDataSetDescriptor(fullName, configNode, _) {
    const metaCfg = this._buildMetaWriteCfg(configNode, 'custom', 'onWrite');
    return configNode.writer && new DataWriteDescriptor(configNode.writer, metaCfg, fullName);
  }

  _buildDataWriteNode(configNode, parent, name, descriptorBuilder, newChildren) {
    const newDataNode = this._buildNodeOnly(
      configNode, parent, name,
      null, descriptorBuilder);

    return newChildren[name] = newDataNode;
  }

  _buildWriters(parent, writers) {
    const newChildren = {};
    forEach(writers, (configNode, name) => {
      this._buildDataWriteNode(configNode, parent, name, this._buildCustomDataSetDescriptor, newChildren);
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

  /**
   * Copy all non-conflicting descendant (lower-level) nodes into all ascendant (upper-level) nodes' children, all the way back into the root
   * 
   * @param {*} node 
   */
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

  /**
   * @returns {DataAccessTracker}
   */
  newAccessTracker(name, listener) {
    return new DataAccessTracker(
      this,
      listener,
      name
    );
  }
}
import isString from 'lodash/isString';
import isFunction from 'lodash/isFunction';
import isArray from 'lodash/isArray';

import autoBind from 'src/util/auto-bind';

import DataDescriptorNode from './DataDescriptorNode';
import PathDescriptor from './PathDescriptor';

export default class DataReadDescriptor extends DataDescriptorNode {
  readData;

  constructor(cfg, name) {
    super(cfg, name);

    autoBind(this);

    this._buildReadData(cfg);
  }

  get nodeType() {
    return 'DataRead';
  }

  // ################################################
  // Private methods
  // ################################################

  _buildReadData(cfg) {
    let readData;
    if (cfg instanceof PathDescriptor) {
      // build reader from pathDescriptor
      readData = this._buildReadDataFromDescriptor(cfg);
    }
    else if (isFunction(cfg)) {
      // custom reader function
      readData = cfg;
    }
    else {
      throw new Error('Could not make sense of DataReadDescriptor config node: ' + JSON.stringify(cfg));
    }
    this.readData = this._wrapAccessFunction(readData);
  }

  _buildReadDataFromDescriptor(pathDescriptor) {
    return (args, readerProxy, injectProxy, callerNode, accessTracker) => {
      // // TODO check if all dependencies are loaded?
      // if (!callerNode.areDependenciesLoaded(this)) {
      //   return null;
      // }

      const pathOrPaths = pathDescriptor.getPath(args, readerProxy, injectProxy, callerNode, accessTracker);

      if (isArray(pathOrPaths)) {
        const paths = pathOrPaths;
        return paths.map(path => this._doReadData(path, callerNode, accessTracker));
      }
      else if (isString(pathOrPaths)) {
        const path = pathOrPaths;
        return this._doReadData(path, callerNode, accessTracker);
      }
      return undefined;
    };
  }

  _doReadData(path, callerNode, accessTracker) {
    const {
      dataProvider
    } = callerNode;

    accessTracker.recordDataAccess(dataProvider, path);
    return dataProvider.readData(path);
  }

  // ################################################
  // Public properties + methods
  // ################################################

  /**
   * Check if all dependencies are loaded
   * 
   * @param {*} args
   */
  areDependenciesLoaded(args) {
    // NOTE: knownDependencies are defined by the createPathTemplate* functions.
    //   These dependencies are currently only obtained from caller-provided arguments.

    // const knownDependencies = this._descriptor.getDependencies();
    // if (!isEmpty(knownDependencies)) {
    //   if (some(
    //     knownDependencies,
    //     sourceName => args[sourceName] !== null
    //   )) {
    //     return false;
    //   }
    // }

    return true;
  }

  /**
   * Check if data is loaded
   */
  isDataLoaded(args, readerProxy, injectProxy, callerNode, accessTracker) {
    // TODO: fix this!

    // 1) check if all dependencies are loaded
    // if (!this.areDependenciesLoaded(args)) {
    //   return false;
    // }
    const data = this.readData(args, readerProxy, injectProxy, callerNode, accessTracker);
    return data !== undefined;
  }
}
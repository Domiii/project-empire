import isPlainObject from 'lodash/isPlainObject';
import isFunction from 'lodash/isFunction';
import isArray from 'lodash/isArray';

import autoBind from 'src/util/auto-bind';

import DataDescriptorNode from './DataDescriptorNode';
import PathDescriptor from './PathDescriptor';

export default class DataReadDescriptor extends DataDescriptorNode {
  getData;
  
  constructor(cfg) {
    super(cfg);

    autoBind(this);

    this._buildGetData(cfg);
  }

  // ################################################
  // Private methods
  // ################################################

  _buildGetData(cfg) {
    let getData;
    if (isPlainObject(cfg instanceof PathDescriptor)) {
      // build reader from pathDescriptor
      getData = this._buildGetDataFromDescriptor(cfg);
    }
    else if (isFunction(cfg)) {
      // custom reader function
      getData = cfg;
    }
    this.getData = this._wrapAccessFunction(getData);
  }

  _buildGetDataFromDescriptor(pathDescriptor) {
    return function _getData(readersByName, readByNameProxy, args, callerNode) {
      // // TODO check if all dependencies are loaded?
      // if (!callerNode.areDependenciesLoaded(this)) {
      //   return null;
      // }

      const pathOrPaths = pathDescriptor.getPath(readersByName, readByNameProxy, args, callerNode);
      const { dataProvider } = callerNode;

      if (isArray(pathOrPaths)) {
        const paths = pathOrPaths;
        return paths.map(path => dataProvider.getData(path));
      }
      else {
        const path = pathOrPaths;
        return dataProvider.getData(path);
      }
    };
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
  isLoaded(args) {
    // TODO: fix this!

    // 1) check if all dependencies are loaded
    if (!this.areDependenciesLoaded(args)) {
      return false;
    }

    // 2) check if actual target is also loaded
    const path = this._descriptor.getPath(args);
    return this.dataSource.isDataLoaded(path);
  }


  boundCall(readersByName, readByNameProxy, args, callerNode) {
    // call path read function
    return this.getData(readersByName, readByNameProxy, args, callerNode);
  }
}
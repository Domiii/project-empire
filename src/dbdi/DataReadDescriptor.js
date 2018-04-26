import isString from 'lodash/isString';
import isFunction from 'lodash/isFunction';
import isArray from 'lodash/isArray';
import partial from 'lodash/partial';

import autoBind from 'src/util/auto-bind';

import DataDescriptorNode from './DataDescriptorNode';
import PathDescriptor from './PathDescriptor';

import { NOT_LOADED } from './dataProviders/DataProviderBase';

export default class DataReadDescriptor extends DataDescriptorNode {
  readData;
  fetch;

  constructor(pathDescriptor, reader, fetch, name) {
    super({ pathDescriptor, reader }, name);

    autoBind(this);
    this.fetch = fetch;

    this._buildReadData(pathDescriptor, reader);
  }

  get nodeType() {
    return 'DataRead';
  }

  // ################################################
  // Private methods
  // ################################################

  _buildReadData(pathDescriptor, reader) {
    let readData;
    if (pathDescriptor) {
      // build reader from pathDescriptor
      readData = this._buildReadDataFromDescriptor(pathDescriptor);
    }

    if (isFunction(reader)) {
      // custom reader function
      if (readData) {
        var origReadData = readData;
        readData = (...allArgs) => {
          const result = origReadData(...allArgs);
          return reader(result, ...allArgs);
        };
      }
      else {
        readData = reader;
      }
    }

    if (!readData) {
      throw new Error('Could not make sense of DataReadDescriptor config node: ' + JSON.stringify(this._cfg));
    }

    this.readData = this._wrapAccessFunction(readData);
  }

  _buildReadDataFromDescriptor(pathDescriptor) {
    return (args, readerProxy, injectProxy, writerProxy, callerNode, accessTracker) => {
      // // TODO check if all dependencies are loaded?
      // if (!callerNode.areDependenciesLoaded(this)) {
      //   return null;
      // }

      const queryInputs = pathDescriptor.getPath(args, readerProxy, injectProxy, writerProxy, callerNode, accessTracker);

      if (queryInputs === undefined) {
        return undefined;
      }

      if (isArray(queryInputs)) {
        return queryInputs.map(queryInput => this._readFromDataProvider(queryInput, args, readerProxy, injectProxy, writerProxy, callerNode, accessTracker));
      }
      else { //if (isString(pathOrPaths)) {
        const queryInput = queryInputs;
        return this._readFromDataProvider(queryInput, args, readerProxy, injectProxy, writerProxy, callerNode, accessTracker);
      }
      //return undefined;
    };
  }

  _readFromDataProvider(queryInput, args, readerProxy, injectProxy, writerProxy, callerNode, accessTracker) {
    const {
      dataProvider
    } = callerNode;

    accessTracker.recordDataAccess(dataProvider, queryInput);
    const result = dataProvider.readData(queryInput);
    if (result === NOT_LOADED) {
      this._doFetch(queryInput, args, readerProxy, injectProxy, writerProxy, callerNode, accessTracker);
    }
    return result;
  }

  async _doFetch(queryInput, args, readerProxy, injectProxy, writerProxy, callerNode, accessTracker) {
    const {
      dataProvider
    } = callerNode;

    // TODO: let callerNode manage an entire fetch hierarchy
    // TODO: in case, this node does not have a fetch entry, but any of it's parents does, go to the closest parent and fetch that first

    const { fetch } = this;
    if (!fetch) return;
      
    if (dataProvider.fetchStart(queryInput)) {
      try {
        const res = await fetch(args, readerProxy, injectProxy, writerProxy, callerNode, accessTracker);
        dataProvider.fetchEnd(queryInput, res);
      }
      catch (err) {
        //throw new Error(
        dataProvider.fetchFailed(queryInput, err);
      }
    }
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
  isDataLoaded(...allArgs) {
    // TODO: fix this!

    // 1) check if all dependencies are loaded
    // if (!this.areDependenciesLoaded(args)) {
    //   return false;
    // }
    const data = this.readData(...allArgs);
    return data !== NOT_LOADED;
  }
}
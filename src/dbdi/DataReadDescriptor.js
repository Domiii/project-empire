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

      const pathOrPaths = pathDescriptor.getPath(args, readerProxy, injectProxy, writerProxy, callerNode, accessTracker);

      if (pathOrPaths === undefined) {
        return undefined;
      }

      if (isArray(pathOrPaths)) {
        const paths = pathOrPaths;
        return paths.map(path => this._readFromDataProvider(path, args, readerProxy, injectProxy, writerProxy, callerNode, accessTracker));
      }
      else { //if (isString(pathOrPaths)) {
        const path = pathOrPaths;
        return this._readFromDataProvider(path, args, readerProxy, injectProxy, writerProxy, callerNode, accessTracker);
      }
      //return undefined;
    };
  }

  _readFromDataProvider(path, args, readerProxy, injectProxy, writerProxy, callerNode, accessTracker) {
    const {
      dataProvider
    } = callerNode;

    const { fetch } = this;

    accessTracker.recordDataAccess(dataProvider, path);
    const result = dataProvider.readData(path);
    if (fetch && result === NOT_LOADED) {
      // TODO: identify + handle all possible...
      //  "fetch states" - e.g.: NEVER_LOADED, FETCHING, FETCHED
      //  and "state changing triggers" - e.g.: a) set path to value b) setting path to NOT_LOADED would reset fetch state
      const fcall = fetch(args, readerProxy, injectProxy, writerProxy, callerNode, accessTracker);
      Promise.resolve(fcall)
        .then(res => {
          // let data provider update state (which should notify all listeners)
          dataProvider.actions.set(path, res);
        })
        .catch(err => {
          throw new Error(`Failed to execute "${this.nodeType}" at path "${path}":\n` + (err && err.stack || err));
        });
    }
    return result;
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
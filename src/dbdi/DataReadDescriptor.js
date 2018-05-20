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
  readOnce;
  reader;
  fetch;

  constructor(pathDescriptor, reader, fetch, name) {
    super({ pathDescriptor, reader, fetch }, name);

    autoBind(this);
    this.reader = reader;
    this.fetch = fetch;

    this._buildReaders();
  }

  get pathDescriptor() {
    return this._cfg.pathDescriptor;
  }

  get readMod() {
    return this.reader;
  }

  get nodeType() {
    return 'DataRead';
  }

  // ####################################################################################################
  // _buildReadData
  // ####################################################################################################

  _buildReaders() {
    // build reader from pathDescriptor
    this.readData = new ImmediateRead().buildReader(this);
    this.readOnce = new AsyncRead().buildReader(this);
  }


  // ################################################
  // Public properties + methods
  // ################################################

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

/**
 * The final read data function has many levels.
 * readOnce cuts some corners, but also needs special handling for promises.
 */
class PathDescriptorReader {
  dataReadDescriptor;
  _doRead;

  buildReader(dataReadDescriptor) {
    this.dataReadDescriptor = dataReadDescriptor;

    if (dataReadDescriptor.pathDescriptor) {
      this._doRead = this.readFromPathDescriptor;
    }
    else if (dataReadDescriptor.fetch && dataReadDescriptor.reader) {
      this._doRead = this.customFetchAndRead;
    }
    else if (dataReadDescriptor.fetch) {
      this._doRead = this.customFetchOnly;
    }
    else if (dataReadDescriptor.reader) {
      this._doRead = this.customReadOnly;
    }
    else {
      throw new Error(`Could not make sense of DataReadDescriptor config node '${dataReadDescriptor.name}' - Must either have 'path', 'reader' and/or 'fetch' property.\n${JSON.stringify(dataReadDescriptor._cfg, null, 2)}`);
    }

    if (!this._doRead) {
      console.assert(this._doRead, 'something went wrong in PathDescriptorReader');
      debugger;
    }

    return this.wrappedRead;
  }

  wrappedRead = () => {
    // 0) Wrap everything in a big old try/catch, so we can throw a meaningful error message
  }

  customReadOnly = (args, readerProxy, injectProxy, writerProxy, callerNode, accessTracker) => {
    const { reader } = this.dataReadDescriptor;
    return reader(args, readerProxy, injectProxy, writerProxy, callerNode, accessTracker);
  }

  readFromPathDescriptor = (args, readerProxy, injectProxy, writerProxy, callerNode, accessTracker) => {
    // // TODO check if all dependencies are loaded?
    // if (!this.areDependenciesLoaded()) { ... }

    // 1) Get the path/queryInput(s) (essentially a higher level version of a "query")
    const { pathDescriptor, readMod } = this.dataReadDescriptor;
    const queryInput = pathDescriptor.getPath(args,
      readerProxy, injectProxy, writerProxy, callerNode, accessTracker);
    if (queryInput === NOT_LOADED) {
      return NOT_LOADED;
    }

    // 2) Read data for given queryInput
    // 2.a) Record access with DataAccessTracker (if needed)
    // 2.b) Read data from data provider
    let result = this.readFromCache(queryInput, args, readerProxy, injectProxy, writerProxy, callerNode, accessTracker);

    // 3) If data is not present, do the fetch thing
    if (result === NOT_LOADED) {
      result = this.doFetch(queryInput, args, readerProxy, injectProxy, writerProxy, callerNode, accessTracker);
    }

    // 4) If there is a custom reader (readMod), use that to modify the result
    if (readMod) {
      result = this.applyReadMod(result, args,
        readerProxy, injectProxy, writerProxy, callerNode, accessTracker);
    }

    return result;
  }
}

class ImmediateRead extends PathDescriptorReader {
  wrappedRead = (...allArgs) => {
    try {
      return this._doRead(...allArgs);
    }
    catch (err) {
      throw new Error(`Failed to read from node "${this.dataReadDescriptor.name}":\n` + (err && err.stack || err));
    }
  }

  customFetchOnly = (args, readerProxy, injectProxy, writerProxy, callerNode, accessTracker) => {
    // fetch is an asynchronous call that generally returns a prommise, and not an immediate value
    throw new Error('Invalid immediate read on node that does neither have path nor custom reader. ' +
      'Maybe you wanted to call readOnce (which returns a promise) instead?');
  }

  customFetchAndRead = (args, readerProxy, injectProxy, writerProxy, callerNode, accessTracker) => {
    // ignore fetch for immediate read
    return this.customReadOnly(args, readerProxy, injectProxy, writerProxy, callerNode, accessTracker);
  }

  readFromCache = (queryInput, args, readerProxy, injectProxy, writerProxy, callerNode, accessTracker) => {
    const {
      dataProvider
    } = callerNode;

    // start listening on + loading from the given path (queryInput)
    accessTracker._recordDataAccess(dataProvider, queryInput);

    // read data
    return dataProvider.readData(queryInput);
  }

  /**
   * If custom fetch has been supplied to descriptor, 
   * use it, and also track fetch status in DataProvider.
   */
  doFetch = (queryInput, args,
    readerProxy, injectProxy, writerProxy, callerNode, accessTracker) => {
    const {
      dataProvider
    } = callerNode;

    // TODO: let callerNode manage an entire fetch hierarchy
    //    -> in case, this node does not have a fetch entry, but any of it's parents does, go to the closest parent and fetch that first

    const { fetch } = this.dataReadDescriptor;
    if (!fetch) return;

    (async () => {
      if (await dataProvider.fetchStart(queryInput)) {
        try {
          const res = await fetch(args, readerProxy, injectProxy, writerProxy, callerNode, accessTracker);
          dataProvider.fetchEnd(queryInput, res);
        }
        catch (err) {
          //throw new Error(
          dataProvider.fetchFailed(queryInput, err);
        }
      }
    })();

    return NOT_LOADED;
  }

  applyReadMod(result, args, readerProxy, injectProxy, writerProxy, callerNode, accessTracker) {
    const { reader } = this.dataReadDescriptor;
    return reader(result, args, readerProxy, injectProxy, writerProxy, callerNode, accessTracker);
  }
}




// ####################################################################################################
// readOnce (read or fetch)
// ####################################################################################################

class AsyncRead extends PathDescriptorReader {
  wrappedRead = async (...allArgs) => {
    try {
      return await this._doRead(...allArgs);
    }
    catch (err) {
      throw new Error(`Failed to read from node "${this.dataReadDescriptor.name}":\n` + (err && err.stack || err));
    }
  }

  customFetchOnly = async (args, readerProxy, injectProxy, writerProxy, callerNode, accessTracker) => {
    const { fetch } = this.dataReadDescriptor;
    let result = await fetch(args, readerProxy, injectProxy, writerProxy, callerNode, accessTracker);
    return result;
  }

  customFetchAndRead = async (args, readerProxy, injectProxy, writerProxy, callerNode, accessTracker) => {
    const { reader, fetch } = this.dataReadDescriptor;
    let result = await fetch(args, readerProxy, injectProxy, writerProxy, callerNode, accessTracker);

    // 4) If there is a custom reader (readMod), use that to modify the result
    result = await this.applyReadMod(result, args,
      readerProxy, injectProxy, writerProxy, callerNode, accessTracker);
    return result;
  }

  /**
   * Since this a fire-and-forget read -> we don't need to track access.
   * Also: NOTE that this is not an async function!
   */
  readFromCache = (queryInput, args,
    readerProxy, injectProxy, writerProxy, callerNode, accessTracker) => {
    const {
      dataProvider
    } = callerNode;

    // NOTE: we don't need to tell the DataAccessTracker, since this is not "data-bound"

    // read data
    return dataProvider.readData(queryInput);
  }

  /**
   * If no custom fetcher is provided, just fetch from the DataProvider
   */
  doFetch = async (queryInput, args, readerProxy, injectProxy, writerProxy, callerNode, accessTracker) => {
    const {
      dataProvider
    } = callerNode;

    const { fetch } = this.dataReadDescriptor;
    if (!fetch) {
      // no custom fetch provided -> go to DataProvider
      // (fetch and forget)
      return await dataProvider.fetchOnce(queryInput);
    }

    // custom fetch
    return await fetch(args, readerProxy, injectProxy, writerProxy, callerNode, accessTracker);
  }

  /**
   * Wrap result promise
   */
  applyReadMod = async (result, args, readerProxy, injectProxy, writerProxy, callerNode, accessTracker) => {
    // result is actually a promise here -> resolve before moving on!
    result = await result;
    const { reader } = this.dataReadDescriptor;
    return await this.reader(result, args, readerProxy, injectProxy, writerProxy, callerNode, accessTracker);
  }
}


  // /**
  //  * Check if all dependencies are loaded
  //  * 
  //  * @param {*} args
  //  */
  // areDependenciesLoaded(args) {
  //   // NOTE: knownDependencies are defined by the createPathTemplate* functions.
  //   //   These dependencies are currently only obtained from caller-provided arguments.

  //   // const knownDependencies = this._descriptor.getDependencies();
  //   // if (!isEmpty(knownDependencies)) {
  //   //   if (some(
  //   //     knownDependencies,
  //   //     sourceName => args[sourceName] !== null
  //   //   )) {
  //   //     return false;
  //   //   }
  //   // }

  //   return true;
  // }
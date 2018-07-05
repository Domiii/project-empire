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
  readAsync;
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
    this.readAsync = new AsyncRead().buildReader(this);
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
 * readAsync cuts some corners, but also needs special handling for promises.
 */
class PathDescriptorReader {
  dataReadDescriptor;
  _doRead;

  // TODO: make fetch work through-out the hierarchy
  getFetchInHierarchy() {
    // -> in case, this node does not have a fetch entry, but any of it's parents does, 
    //      -> go to the closest parent and fetch that first
    // TODO: Problem - queryInput and callerNode need to be fixed correspondingly
    // TODO: hierarchical fetch lookup must be implemented in every place where fetch is used
    // let node = !fetch && callerNode.parent;
    // while (!fetch && node) {
    //   if (node.readDescriptor) {
    //     fetch = node.readDescriptor.fetch;
    //   }
    //   if (node.parent) {
    //     node = node.parent;
    //   }
    // }

    let { fetch } = this.dataReadDescriptor;
    return fetch;
  }

  buildReader(dataReadDescriptor) {
    this.dataReadDescriptor = dataReadDescriptor;

    const fetch = this.getFetchInHierarchy();

    if (dataReadDescriptor.pathDescriptor) {
      this._doRead = this.readFromPathDescriptor;
    }
    else if (fetch && dataReadDescriptor.reader) {
      this._doRead = this.customFetchAndRead;
    }
    else if (fetch) {
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

    // TODO: Make getPath work properly with async fetch
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
    // fetch is an asynchronous call that returns a prommise, and not an immediate value
    throw new Error('Invalid immediate read on node that does neither have path nor custom reader. ' +
      'Maybe you wanted to call readAsync (which returns a promise) instead?');
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

    const fetch = this.getFetchInHierarchy();

    if (!fetch) return NOT_LOADED;

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
// AsyncRead
// ####################################################################################################

/**
 * AsyncRead is used for the readAsync method which is an asynchronous one-shot read or fetch
 * and does not trigger cache or listener updates.
 */
class AsyncRead extends PathDescriptorReader {
  wrappedRead = async (...allArgs) => {
    try {
      return await this._doRead(...allArgs);
    }
    catch (err) {
      throw new Error(`Failed to read from node "${this.dataReadDescriptor.name}":\n` + (err && err.stack || err));
    }
  }

  customReadOnly = (args, readerProxy, injectProxy, writerProxy, callerNode, accessTracker) => {
    throw new Error('Tried to fetch data asynchronously from reader that neither defined `fetch` nor `path');
    // const { reader } = this.dataReadDescriptor;
    // return reader(args, readerProxy, injectProxy, writerProxy, callerNode, accessTracker);
  }

  customFetchOnly = async (args, readerProxy, injectProxy, writerProxy, callerNode, accessTracker) => {
    const fetch = this.getFetchInHierarchy();
    let result = await fetch(args, readerProxy, injectProxy, writerProxy, callerNode, accessTracker);
    return result;
  }

  customFetchAndRead = async (args, readerProxy, injectProxy, writerProxy, callerNode, accessTracker) => {
    const fetch = this.getFetchInHierarchy();
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

    // NOTE: we don't need to tell the DataAccessTracker, since we don't need data binding for this.

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

    const fetch = this.getFetchInHierarchy();
    //console.warn(this.dataReadDescriptor, queryInput, fetch, pathDescriptor);
    if (fetch) {
      // custom fetch
      return await fetch(args, readerProxy, injectProxy, writerProxy, callerNode, accessTracker);
    }

    // no custom fetch provided -> go to DataProvider
    // (fetch and forget)
    return await dataProvider.fetchOnce(queryInput);
  }

  /**
   * Wrap result promise
   */
  applyReadMod = async (result, args, readerProxy, injectProxy, writerProxy, callerNode, accessTracker) => {
    // result is actually a promise here -> resolve before moving on!
    result = await result;
    //const { reader } = this.dataReadDescriptor;
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
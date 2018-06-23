import { writeParameterConfig } from 'src/dbdi/DataWriteDescriptor';

import isObject from 'lodash/isObject';
import isPlainObject from 'lodash/isPlainObject';
import isFunction from 'lodash/isFunction';

import autoBind from 'src/util/auto-bind';

import { EmptyObject, EmptyArray } from 'src/util';

import { sharedArgumentProxyProperties } from './ProxyUtil';

export default class DataAccessTracker {
  _dataSourceTree;
  _listener;
  _dataProviders = new Set();

  _injectProxy;
  _readerProxy;
  _writerProxy;

  _wrappedReaders = {};
  _wrappedWriters = {};

  constructor(dataSourceTree, listener, name) {
    console.assert(!listener || isFunction(listener), 'listener must be function');

    this._dataSourceTree = dataSourceTree;
    this._listener = listener;

    this._name = name || '<unnamed DataAccessTracker>';

    autoBind(this);

    this._buildProxies();
  }
s
  // ################################################
  // Private methods + properties
  // ################################################

  _buildProxies() {
    this._injectProxy = new Proxy({}, this._buildDataInjectProxyHandler());
    this._readerProxy = new Proxy({}, this._buildReaderProxyHandler());
    this._writerProxy = new Proxy({}, this._buildWriterProxyHandler());
  }

  _buildDataInjectProxyHandler() {
    return {
      get: (target, name) => {
        // if (name in specialProxyProperties) {
        //   return specialProxyProperties[name](target);
        // }

        // resolve node and return read data
        const readData = this.resolveReadDataForce(name);
        return readData();
      },
      has: (target, name) => {
        // if (name in specialProxyProperties) {
        //   return true;
        // }

        const fn = this.resolveReadData(name);
        return !!fn;
      },

      enumerate() {
        throw new Error('[NYI] cannot enumerate "Inject" proxy (yet)');
      },

      ownKeys() {
        throw new Error('[NYI] cannot enumerate "Inject" proxy (yet)');
      }
    };
  }

  _buildReaderProxyHandler() {
    return {
      get: (target, name) => {
        // if (name in specialProxyProperties) {
        //   return specialProxyProperties[name](target);
        // }

        // resolve node and return call function to caller.
        // let caller decide when to make the actual call and which arguments to supply.
        return this.resolveReadDataForce(name);
      },
      has: (target, name) => {
        // if (name in specialProxyProperties) {
        //   return true;
        // }

        const fn = this.resolveReadData(name);
        return !!fn;
      },

      enumerate() {
        throw new Error('[NYI] cannot enumerate "Reader" proxy (yet)');
      },

      ownKeys() {
        throw new Error('[NYI] cannot enumerate "Reader" proxy (yet)');
      }
    };
  }

  _buildWriterProxyHandler() {
    return {
      get: (target, name) => {
        // if (name in specialProxyProperties) {
        //   return specialProxyProperties[name](target);
        // }

        // resolve node and return call function to caller.
        // let caller decide when to make the actual call and which arguments to supply.
        return this.resolveWriteDataForce(name);
      },
      has: (target, name) => {
        // if (name in specialProxyProperties) {
        //   return true;
        // }

        const fn = this.resolveWriteData(name);
        return !!fn;
      },

      enumerate() {
        throw new Error('[NYI] cannot enumerate "Writer" proxy (yet)');
      },

      ownKeys() {
        throw new Error('[NYI] cannot enumerate "Writer" proxy (yet)');
      }
    };
  }

  _resolveArgumentHandler = {
    get: (target, name) => {
      if (name in sharedArgumentProxyProperties) {
        return sharedArgumentProxyProperties[name](target);
      }
      if (!(name in target)) {
        console.warn(`Requested argument was not supplied for ${this._name}:`, name);
      }
      return target[name];
    },

    has: (target, name) => {
      if (name in sharedArgumentProxyProperties) {
        return true;
      }
      return target.hasOwnProperty(name);
    },

    enumerate(target) {
      return Object.keys(target);
    },

    ownKeys(target) {
      return Object.keys(target);
    }
  };

  _wrapArgs(args, node) {
    if (args && args.____isWrapperProxy) {
      // already wrapped
      return args;
    }

    if (args !== undefined && args !== null && !isPlainObject(args)) {
      let moreInfo = '';
      if (isObject(args)) {
        if (args.constructor) {
          moreInfo = `object of type "${args.constructor.name}"`;
          try {
            moreInfo += ` - ${JSON.stringify(args)}`;
          }
          catch (err) {
            //moreInfo += ` (could not stringify object - ${err.message})`;
            const keys = Object.keys(args);
            moreInfo += ` - with ${keys.length} keys: ${keys}`;
          }
        }
        else {
          moreInfo = `<object of unknown type>\n → keys: ${Object.keys(args)}`;
        }
      }
      else {
        moreInfo = args;
      }
      throw new Error(`Invalid arguments for data node "${node.fullName}"\n` +
        `→ expected plain object but found: ${moreInfo} ←\n` +
        '(Did you pass a data accessor as event (use "asEventHandler" instead!)?)');
    }
    args = args || EmptyObject;
    return new Proxy(args, this._resolveArgumentHandler);
  }

  _wrapReadData(node) {
    const wrappedReadData = (args) => {
      return node.readData(this._wrapArgs(args, node), this._readerProxy, this._injectProxy, this._writerProxy, this);
    };

    wrappedReadData.isLoaded = (args) => {
      return node.isDataLoaded(this._wrapArgs(args, node), this._readerProxy, this._injectProxy, this._writerProxy, this);
    };

    wrappedReadData.readAsync = (args) => {
      return node.readAsync(this._wrapArgs(args, node), this._readerProxy, this._injectProxy, this._writerProxy, this);
    };

    wrappedReadData.areAllLoaded = (idArgs, args) => {
      return node.areAllLoaded(idArgs, this._wrapArgs(args, node), this._readerProxy, this._injectProxy, this._writerProxy, this);
    };

    return this._decorateWrapper(wrappedReadData, node);
  }

  _wrapWriteData(node) {
    const writeDescriptor = node.writeDescriptor;

    // get parameter config for action
    const paramConfig = writeParameterConfig[writeDescriptor.actionName];
    console.assert(paramConfig, 'writeParameterConfig in _wrapWriteData not defined for action ' + writeDescriptor.actionName);
    const {
      processArguments
    } = paramConfig;

    const wrappedWriteData = (...writeArgs) => {
      // figure out the arguments for this action and wrap them
      const allArgs = processArguments(node, writeArgs);
      allArgs.queryArgs = this._wrapArgs(allArgs.queryArgs, node);

      if (allArgs.val && allArgs.val.____isWrapperProxy) {
        //throw new Error();
        allArgs.val = allArgs.val.____proxyGetUnderlyingTarget;
      }

      return node.writeData(allArgs, this._readerProxy, this._injectProxy, this._writerProxy, this);
    };

    return this._decorateWrapper(wrappedWriteData, node);
  }

  /**
   * Decorate any access wrapper, be it read or write.
   */
  _decorateWrapper(wrapper, node) {
    const { pathDescriptor } = node;
    if (!pathDescriptor) {
      wrapper.getPath = () => { return undefined; };
    }
    else {
      wrapper.getPath = (args) => {
        return pathDescriptor.getPath(args, this._readerProxy, this._injectProxy, this);
      };
      wrapper.notifyPathChanged = (args) => {
        const path = pathDescriptor.getPath(args, this._readerProxy, this._injectProxy, this);
        if (path) {
          node.dataProvider.markPossibleUpdate(path);
        }
      };
    }
    return wrapper;
  }

  /**
   * Internally used by DataReadDescriptor to make sure that
   * we will track the given path once it has been read once, until unmount is called.
   */
  _recordDataAccess(dataProvider, path) {
    if (!this._listener) {
      // we need this because registerListener adds the cached query in the DataProvider
      this._listener = () => {};
    }

    dataProvider.registerListener(path, this._listener, this._name);
    this._dataProviders.add(dataProvider);
  }


  // ################################################
  // Resolution
  // ################################################

  resolveReadData(name) {
    if (!this._dataSourceTree.hasReader(name)) {
      return undefined;
    }

    let readData = this._wrappedReaders[name];
    if (!readData) {
      const node = this._dataSourceTree.resolveReader(name);
      this._wrappedReaders[name] = readData =
        this._wrapReadData(node);
    }
    return readData;
  }

  /**
   * Throws error when reader of name does not exist
   */
  resolveReadDataForce(name) {
    const readData = this.resolveReadData(name);
    if (!readData) {
      debugger;
      throw new Error(`DI failed - reader does not exist: "${name}": ${Object.keys(this._dataSourceTree._root._readDescendants).join(', ')}`);
    }
    return readData;
  }

  resolveWriteData(name) {
    if (!this._dataSourceTree.hasWriter(name)) {
      return undefined;
    }

    let writeData = this._wrappedWriters[name];
    if (!writeData) {
      const node = this._dataSourceTree.resolveWriter(name);
      this._wrappedWriters[name] = writeData = this._wrapWriteData(node);
    }
    return writeData;
  }

  resolveWriteDataForce(name) {
    const writeData = this.resolveWriteData(name);
    if (!writeData) {
      throw new Error(`DI failed - writer does not exist: "${name}": ${Object.keys(this._dataSourceTree._root._writeDescendants).join(', ')}`);
    }
    return writeData;
  }

  unmount() {
    if (this._listener) {
      // unregister listener from all data providers
      this._dataProviders.forEach(dataProvider => {
        dataProvider.unregisterListener(this._listener);
      });
      this._dataProviders = new Set();
    }
  }


  // ################################################
  // Direct reads + writes
  // ################################################

  get read() {
    return this._readerProxy;
  }

  get write() {
    return this._writerProxy;
  }

  /**
   * A lot of "writers" are actually more like "actions", 
   * so "do" is a more appropriate verb.
   */
  get do() {
    return this._writerProxy;
  }

  get get() {
    return this._injectProxy;
  }
}
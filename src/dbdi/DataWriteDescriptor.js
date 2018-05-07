import isFunction from 'lodash/isFunction';
import isArray from 'lodash/isArray';
import isEmpty from 'lodash/isEmpty';

import { EmptyObject } from 'src/util';
import autoBind from 'src/util/auto-bind';

import DataDescriptorNode from './DataDescriptorNode';
import PathDescriptor from './PathDescriptor';


const DEBUG_WRITES = true;

/**
 * Writer functions (except for delete) by default accept one or two arguments.
 * If only one argument is given, it is the value to be written.
 * If two arguments are given, the first argument is the queryArgs object passed to the PathDescriptor, and the second argument is the value to be written.
 * 
 * @param {*} node 
 * @param {*} writeArgs 
 */
function processArgumentsDefault(node, writeArgs) {
  let res;
  let queryArgs, val;
  switch (writeArgs.length) {
    // case 0:
    //   res = EmptyObject;
    //   break;
    case 1:
      [val] = writeArgs;
      res = { val };
      break;
    case 2:
      [queryArgs, val] = writeArgs;
      res = { queryArgs, val };
      break;
    default:
      throw new Error(`Invalid argument count provided for write operation at ${node.fullName} (must be 1 or 2): 
          ${JSON.stringify(writeArgs)}`);
  }
  return res;
}

/**
 * Assume only the first argument to be valid,
 * but if first argument is not given, take second.
 * Will only have queryArgs (which will be wrapped with proxy by DataAccessTracker).
 */
function processCustomSetter(node, writeArgs) {
  if (writeArgs.length > 1) {
    console.error('custom writer should only provide one argument but found two:', writeArgs);
  }

  // let [queryArgs, val] = writeArgs;

  // if (!isEmpty(queryArgs) && !isEmpty(val)) {
  //    problem!
  // }

  // if (!queryArgs) {
  //   queryArgs = val;
  // }
  return { queryArgs: writeArgs[0] };
}

function processArgumentsNoValue(node, writeArgs) {
  // only query arguments, no value
  const [queryArgs] = writeArgs;
  return { queryArgs };
}

function processArgumentsUndetermined(node, writeArgs) {
  return { varArgs: writeArgs };
}

export const writeParameterConfig = Object.freeze({
  push: {
    parameterCount: 2,
    processArguments: processArgumentsDefault
  },
  set: {
    parameterCount: 2,
    processArguments: processArgumentsDefault
  },
  update: {
    parameterCount: 2,
    processArguments: processArgumentsDefault
  },
  delete: {
    parameterCount: 1,
    processArguments: processArgumentsNoValue
  },
  custom: {
    parameterCount: 1,
    //processArguments: processArgumentsUndetermined
    processArguments: processCustomSetter
  }
});

export default class DataWriteDescriptor extends DataDescriptorNode {
  actionName;
  onWrite;
  pathDescriptor;

  writeData;

  constructor(writerCfg, writeMetaCfg, name) {
    super(writerCfg, name);

    this.actionName = writeMetaCfg.actionName;
    this.onWrite = writeMetaCfg.onWrite;

    autoBind(this);

    this._buildWriteData(writerCfg);
  }

  get nodeType() {
    return 'DataWrite';
  }

  // ################################################
  // Private properties + methods
  // ################################################

  _buildWriteData(writerCfg) {
    let writeData;
    if (writerCfg instanceof PathDescriptor) {
      // build writer from pathDescriptor
      writeData = this._buildWriterFromDescriptor(writerCfg);
    }
    else if (isFunction(writerCfg)) {
      // custom writer function
      writeData = this._buildCustomWriter(writerCfg);
    }
    else {
      throw new Error('Could not make sense of writer config node (must be function or path config) - ' + JSON.stringify(writerCfg));
    }
    this.writeData = this._wrapAccessFunction(writeData);
  }

  _doGetPath(pathDescriptor, args, readerProxy, injectProxy, callerNode, accessTracker) {
    const pathOrPaths = pathDescriptor.getPath(args, readerProxy, injectProxy, callerNode, accessTracker);

    if (pathOrPaths) {
      if (isArray(pathOrPaths)) {
        throw new Error('');
      }
      else {
        const path = pathOrPaths;
        return path;
      }
    }

    throw new Error('Tried to write to path but not all arguments were provided: ' + this._name);
  }

  
  /**
   * This is used only in nodes that (1) don't have a path and (2) provided an explicit `writer` function.
   * NOTE: Method signature of custom writers are slightly different, in that they don't separate `queryArgs` and `val`
   * (but rather any written value is contained in the `queryArgs`).
   */
  _buildCustomWriter(writerFn) {
    return (args, readerProxy, injectProxy, writerProxy, callerNode, accessTracker) => {
      // // TODO check if all dependencies are loaded?
      // if (!callerNode.areDependenciesLoaded(this)) {
      //   return null;
      // }

      const {
        //varArgs
        queryArgs,
        //val
      } = args;

      this.onWrite && this.onWrite(queryArgs, readerProxy, injectProxy, writerProxy, callerNode, accessTracker);
      return writerFn(queryArgs, readerProxy, injectProxy, writerProxy, callerNode, accessTracker);
      // this.onWrite && this.onWrite(...varArgs, readerProxy, injectProxy, writerProxy, callerNode, accessTracker);
      // return writerFn(...varArgs, readerProxy, injectProxy, writerProxy, callerNode, accessTracker);
    };
  }

  _buildWriterFromDescriptor(pathDescriptor) {
    this.pathDescriptor = pathDescriptor;
    return (args, readerProxy, injectProxy, writerProxy, callerNode, accessTracker) => {
      // // TODO check if all dependencies are loaded?
      // if (!callerNode.areDependenciesLoaded(this)) {
      //   return null;
      // }

      const {
        queryArgs,
        val
      } = args;

      const path = this._doGetPath(pathDescriptor, queryArgs, readerProxy, injectProxy, callerNode, accessTracker);
      return this._writeToPath(path, val, queryArgs, readerProxy, injectProxy, writerProxy, callerNode, accessTracker);
    };
  }

  /**
   * This is called when writing to a node built from a PathDescriptor.
   */
  _writeToPath(queryInput, val, queryArgs, readerProxy, injectProxy, writerProxy, callerNode, accessTracker) {
    const {
      dataProvider
    } = callerNode;

    //accessTracker.recordDataWrite(dataProvider, path, val);

    // update indices first
    if (this.pathDescriptor && this.pathDescriptor.indices) {
      this.pathDescriptor.indices.updateIndices(val);
    }

    // custom write hooks
    const originalVal = dataProvider.readData(queryInput);
    this.onWrite && this.onWrite(queryArgs, val, originalVal, this.actionName, 
        readerProxy, injectProxy, writerProxy, callerNode, accessTracker);

    // perform write action
    return dataProvider.actions[this.actionName](queryInput, val);
  }
}
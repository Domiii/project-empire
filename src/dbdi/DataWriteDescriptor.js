import isFunction from 'lodash/isFunction';
import isArray from 'lodash/isArray';

import autoBind from 'src/util/auto-bind';

import DataDescriptorNode from './DataDescriptorNode';
import PathDescriptor from './PathDescriptor';


const DEBUG_WRITES = true;

function processArgumentsDefault(node, writeArgs) {
  let res;
  let queryArgs, val;
  switch (writeArgs.length) {
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
    parameterCount: '?',
    //processArguments: processArgumentsUndetermined
    processArguments: processArgumentsNoValue
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
      writeData = this._buildWriteDataFromDescriptor(writerCfg);
    }
    else if (isFunction(writerCfg)) {
      // custom writer function
      writeData = this._wrapCustomWriter(writerCfg);
    }
    else {
      throw new Error('Could not make sense of DataWriteDescriptor config node: ' + JSON.stringify(writerCfg));
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

    throw new Error('Tried to write to path but not all arguments were provided: ' + this.fullName);
  }

  _wrapCustomWriter(writerFn) {
    return (args, readerProxy, injectProxy, writerProxy, callerNode, accessTracker) => {
      // // TODO check if all dependencies are loaded?
      // if (!callerNode.areDependenciesLoaded(this)) {
      //   return null;
      // }

      const {
        //varArgs
        queryArgs
      } = args;

      this.onWrite && this.onWrite(queryArgs, readerProxy, injectProxy, writerProxy, callerNode, accessTracker);
      return writerFn(queryArgs, readerProxy, injectProxy, writerProxy, callerNode, accessTracker);
      // this.onWrite && this.onWrite(...varArgs, readerProxy, injectProxy, writerProxy, callerNode, accessTracker);
      // return writerFn(...varArgs, readerProxy, injectProxy, writerProxy, callerNode, accessTracker);
    };
  }

  _buildWriteDataFromDescriptor(pathDescriptor) {
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
      return this._doWriteData(path, val, queryArgs, readerProxy, injectProxy, writerProxy, callerNode, accessTracker);
    };
  }

  _doWriteData(path, val, queryArgs, readerProxy, injectProxy, writerProxy, callerNode, accessTracker) {
    const {
      dataProvider
    } = callerNode;

    //accessTracker.recordDataWrite(dataProvider, path, val);

    // update indices first
    if (this.pathDescriptor && this.pathDescriptor.indices) {
      this.pathDescriptor.indices.updateIndices(val);
    }

    // custom write hooks
    this.onWrite && this.onWrite(queryArgs, val, readerProxy, injectProxy, writerProxy, callerNode, accessTracker);

    // perform write action
    return dataProvider.actions[this.actionName](path, val);
  }
}
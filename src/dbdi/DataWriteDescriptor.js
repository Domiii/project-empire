import isPlainObject from 'lodash/isPlainObject';
import isFunction from 'lodash/isFunction';
import isArray from 'lodash/isArray';

import autoBind from 'src/util/auto-bind';

import DataDescriptorNode from './DataDescriptorNode';
import PathDescriptor from './PathDescriptor';


const DEBUG_WRITES = true;

export default class DataWriteDescriptor extends DataDescriptorNode {
  _actionName;
  writeData;

  constructor(cfg, name, actionName) {
    super(cfg, name);
    
    this._actionName = actionName;

    autoBind(this);

    this._buildWriteData(cfg);
  }

  get nodeType() {
    return 'DataWrite';
  }

  // ################################################
  // Private properties + methods
  // ################################################

  _buildWriteData(cfg) {
    let writeData;
    if (cfg instanceof PathDescriptor) {
      // build writer from pathDescriptor
      writeData = this._buildWriteDataFromDescriptor(cfg);
    }
    else if (isFunction(cfg)) {
      // custom writer function
      writeData = cfg;
    }
    else {
      throw new Error('Could not make sense of DataWriteDescriptor config node: ' + JSON.stringify(cfg));
    }
    this.writeData = this._wrapAccessFunction(writeData);
  }

  _doGetPath(pathDescriptor, args, readByNameProxy, readersByName, callerNode, accessTracker) {
    const pathOrPaths = pathDescriptor.getPath(args, readByNameProxy, readersByName, callerNode, accessTracker);

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

  _buildWriteDataFromDescriptor(pathDescriptor) {
    return (args, val, readByNameProxy, readersByName, callerNode, accessTracker) => {
      // // TODO check if all dependencies are loaded?
      // if (!callerNode.areDependenciesLoaded(this)) {
      //   return null;
      // }
      
      const path = this._doGetPath(pathDescriptor, args, readByNameProxy, readersByName, callerNode, accessTracker);
      return this._doWriteData(path, val, callerNode, accessTracker);
    };
  }
  
  _doWriteData(path, val, callerNode, accessTracker) {
    const {
      dataProvider
    } = callerNode;

    //accessTracker.recordDataWrite(dataProvider, path, val);
    return dataProvider.actions[this._actionName](path, val);
    //dataProvider.writeData(path, val);
  } 
}
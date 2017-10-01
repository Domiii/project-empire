import isPlainObject from 'lodash/isPlainObject';
import isFunction from 'lodash/isFunction';
import isArray from 'lodash/isArray';

import autoBind from 'src/util/auto-bind';

import DataDescriptorNode from './DataDescriptorNode';
import PathDescriptor from './PathDescriptor';

export default class DataWriteDescriptor extends DataDescriptorNode {
  writeData;

  constructor(cfg) {
    super(cfg);

    autoBind(this);

    //this._buildGetData(cfg);
  }

  get nodeType() {
    return 'DataWrite';
  }

  // ################################################
  // Private methods
  // ################################################

  // TODO

  // // ################################################
  // // Public properties + methods
  // // ################################################

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



  execute(args, readByNameProxy, readersByName, callerNode) {
    // call path read function
    return this.writeData(args, readByNameProxy, readersByName, callerNode);
  }
}
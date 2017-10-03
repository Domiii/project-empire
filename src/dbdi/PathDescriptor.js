import isString from 'lodash/isString';
import isArray from 'lodash/isArray';


import autoBind from 'src/util/auto-bind';

import {
  createPathGetterFromTemplateProps
} from 'src/firebaseUtil/dataUtil';

import DataDescriptorNode from './DataDescriptorNode';

export default class PathDescriptor extends DataDescriptorNode {
  getPath;

  constructor(pathConfig, name) {
    super(pathConfig, name);

    autoBind(this);

    this._buildPathGetter(pathConfig);
  }

  get nodeType() {
    return 'Path';
  }

  // ################################################
  // Private methods
  // ################################################

  _buildPathGetter(pathConfig) {
    let getPath;
    const { pathTemplate, queryParams, pathFn } = pathConfig;
    if (!pathFn) {
      getPath = this._buildGetPathFromTemplateString(pathTemplate, queryParams);
    }
    else {
      getPath = pathFn;
    }

    // finally, wrap path getter call
    this.getPath = this._wrapGetPath(getPath);
  }

  _wrapGetPath(getPath) {
    return function _wrappedGetPath(args, readByNameProxy, readersByName, callerNode, accessTracker) {
      let path;
      try {
        path = getPath(args, readByNameProxy, readersByName, callerNode, accessTracker);
      }
      catch (err) {
        console.error('Failed to execute getPath at: ' + this + ' - ' + err.stack);
      }

      if (path !== undefined && !isString(path) && !isArray(path)) {
        // TODO: (low prio) Proper type checking (e.g.: https://github.com/gkz/type-check)
        throw new Error('getPath did not return string or array-of-string at: ' + this);
      }
      return path;
    };
  }

  _buildGetPathFromTemplateString(pathTemplate, queryParams) {
    // TODO: handle queryParams properly!
    const getPathRaw = createPathGetterFromTemplateProps(pathTemplate);
    //const argNames = getPathRaw.pathInfo && getPathRaw.pathInfo.varNames;
    if (!queryParams) {
      return (args, readByNameProxy, readersByName, callerNode, accessTracker) => {
        return getPathRaw(args);
      };
    }
    else {
      return (args, readByNameProxy, readersByName, callerNode, accessTracker) => {
        return {
          path: getPathRaw(args),
          queryParams
        };
      };
    }
  }

  
  // ################################################
  // Public properties + methods
  // ################################################

  execute(args, readByNameProxy, readersByName, callerNode, accessTracker) {
    // call path read function
    return this.getPath(args, readByNameProxy, readersByName, callerNode, accessTracker);
  }
}
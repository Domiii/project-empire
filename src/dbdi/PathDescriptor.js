import isString from 'lodash/isString';
import isArray from 'lodash/isArray';


import autoBind from 'src/util/auto-bind';

import {
  createPathGetterFromTemplateProps
} from 'src/firebaseUtil/dataUtil';

import DataDescriptorNode from './DataDescriptorNode';

export default class PathDescriptor extends DataDescriptorNode {
  _pathConfig;
  _getPath;

  constructor(pathConfig) {
    super();

    this._pathConfig = pathConfig;

    autoBind(this);

    this._buildPathGetter(pathConfig);
  }

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
    this._getPath = this._wrapGetPath(getPath);
  }

  _wrapGetPath(getPath) {
    return function _wrappedGetPath(readersByName, readByNameProxy, args, callerNode) {
      let path;
      try {
        path = getPath(readersByName, readByNameProxy, args, callerNode);
      }
      catch (err) {
        throw new Error('Failed to execute getPath at: ' + this + ' - ' + err.stack);
      }

      if (!isString(path) && !isArray(path)) {
        // TODO: (low prio) Proper type checking (e.g.: https://github.com/gkz/type-check)
        throw new Error('getPath did not return string or array-of-string at: ' + this);
      }
      return path;
    };
  }

  _buildGetPathFromTemplateString(pathTemplate, queryParams) {
    // TODO: queryParams
    const getPathRaw = createPathGetterFromTemplateProps(pathTemplate);
    //const argNames = getPathRaw.pathInfo && getPathRaw.pathInfo.varNames;
    return function _getPathFromTemplateString(readersByName, readByNameProxy, args, callerNode) {
      return getPathRaw(args);
    };
  }

  // ################################################
  // Public properties + methods
  // ################################################

  boundCall(readersByName, readByNameProxy, args, callerNode) {
    // call path read function
    return this._getPath(readersByName, readByNameProxy, args, callerNode);
  }
}
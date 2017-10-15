import isString from 'lodash/isString';
import isArray from 'lodash/isArray';
import isFunction from 'lodash/isFunction';


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
  
  
  // ################################################
  // Public properties + methods
  // ################################################

  get nodeType() {
    return 'Path';
  }

  buildParentPathDescriptor(name) {
    const { pathTemplate, pathFn } = this.config;
    if (isString(pathTemplate) && !pathFn) {
      const newPathTemplate = pathTemplate.split('/').slice(0, -1).join('/');
      return new PathDescriptor({
        pathTemplate: newPathTemplate
      }, name);
    }
    return this;
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
    return function _wrappedGetPath(args, readerProxy, injectProxy, callerNode, accessTracker) {
      let path;
      try {
        path = getPath(args, readerProxy, injectProxy, callerNode, accessTracker);
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

  _buildGetPathFromTemplateString(pathTemplate, _queryParams) {
    // TODO: handle queryParams properly!
    const getPathRaw = createPathGetterFromTemplateProps(pathTemplate);
    //const argNames = getPathRaw.pathInfo && getPathRaw.pathInfo.varNames;
    if (!_queryParams) {
      return (args, readerProxy, injectProxy, callerNode, accessTracker) => {
        return getPathRaw(args);
      };
    }
    else {
      return (args, readerProxy, injectProxy, callerNode, accessTracker) => {
        const queryParams = isFunction(_queryParams) ? 
          _queryParams(args, readerProxy, injectProxy, callerNode, accessTracker) :
          queryParams;
        return {
          path: getPathRaw(args),
          queryParams
        };
      };
    }
  }
}
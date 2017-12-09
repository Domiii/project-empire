import isString from 'lodash/isString';
import isArray from 'lodash/isArray';
import isFunction from 'lodash/isFunction';
import isPlainObject from 'lodash/isPlainObject';


import autoBind from 'src/util/auto-bind';

import {
  createPathGetterFromTemplateProps
} from 'src/firebaseUtil/dataUtil';

import { 
  makeIndices
} from 'src/firebaseUtil/indices';

import DataDescriptorNode from './DataDescriptorNode';

const defaultIndexSettings = {
  forceSimpleEncoding: true
};

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
    const { pathTemplate, queryParams, pathFn, indices } = pathConfig;
    
    this.indices = indices && makeIndices(indices, defaultIndexSettings);

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

      // if (path !== undefined && !isArray(path)) { //&& !isString(path)) {
      //   // TODO: (low prio) Proper type checking (e.g.: https://github.com/gkz/type-check)
      //   throw new Error('getPath did not return string or array-of-string at: ' + this);
      // }
      return path;
    };
  }

  _transformQueryParams(queryParamsRaw) {
    if (isPlainObject(queryParamsRaw)) {
      debugger;
      if (this.indices) {
        return this.indices.where(queryParamsRaw);
      }
    }
    return queryParamsRaw;
  }

  _buildGetPathFromTemplateString(pathTemplate, _queryParamsInput) {
    const indices = this.indices;
    const variableTransform = indices && indices.encodeQueryValue.bind(indices);
    const getPathRaw = createPathGetterFromTemplateProps(pathTemplate, variableTransform);
    
    //const argNames = getPathRaw.pathInfo && getPathRaw.pathInfo.varNames;
    if (!_queryParamsInput) {
      // simpler!
      return (args, readerProxy, injectProxy, callerNode, accessTracker) => {
        return getPathRaw(args);
      };
    }
    else {
      // handle custom query parameters
      return (args, readerProxy, injectProxy, callerNode, accessTracker) => {
        // get queryParams
        const queryParamsRaw = isFunction(_queryParamsInput) ? 
          _queryParamsInput(args, readerProxy, injectProxy, callerNode, accessTracker) :
          queryParamsRaw;

        // apply transform
        const queryParams = this._transformQueryParams(queryParamsRaw);
        
        return {
          path: getPathRaw(args),
          queryParams
        };
      };
    }
  }
}
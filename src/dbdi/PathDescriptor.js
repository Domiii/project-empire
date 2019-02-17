import isString from 'lodash/isString';
import isArray from 'lodash/isArray';
import isFunction from 'lodash/isFunction';
import isPlainObject from 'lodash/isPlainObject';

import { pathJoin } from 'src/util/pathUtil';


import autoBind from 'src/util/auto-bind';

import {
  createPathGetterFromTemplateProps
} from './PathUtil';

import { 
  makeIndices
} from './indices';

import DataDescriptorNode from './DataDescriptorNode';

const defaultIndexSettings = {
  forceSimpleEncoding: true
};

export default class PathDescriptor extends DataDescriptorNode {
  getPath;
  parent;

  constructor(parent, pathConfig, name) {
    super(pathConfig, name);

    this.parent = parent;

    autoBind(this);

    this._buildPathGetter(pathConfig);
  }
  
  
  // ################################################
  // Public properties + methods
  // ################################################

  get nodeType() {
    return 'Path';
  }

  getParentPathDescriptor() {
    return this.parent;
  }

  updatePath() {
    this.setPath(this.config.localPathTemplate);
  }

  getLocalPath() {
    return this.config.localPathTemplate;
  }

  setPath(path) {
    this.config.localPathTemplate = path;
    this.config.pathTemplate = pathJoin(this.parent.config.pathTemplate, path);
    this._buildPathGetter();
  }

  // ################################################
  // Private methods
  // ################################################

  _buildPathGetter() {
    const pathConfig = this.config;
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
      if (this.indices) {
        return this.indices.where(queryParamsRaw);
      }
    }
    return queryParamsRaw;
  }

  _buildGetPathFromTemplateString(pathTemplate, _queryParamsInput) {
    const indices = this.indices;
    const variableTransform = indices && indices.encodeQueryValueForProps.bind(indices);
    const getPathRaw = createPathGetterFromTemplateProps(pathTemplate, variableTransform);
    
    //const argNames = getPathRaw.pathInfo && getPathRaw.pathInfo.varNames;
    if (!_queryParamsInput) {
      // no custom query parameters
      return (args, readerProxy, injectProxy, callerNode, _accessTracker) => {
        return this._getPath(args, getPathRaw);
      };
    }
    else {
      // handle custom query parameters
      return (args, readerProxy, injectProxy, callerNode, accessTracker) => {
        // get queryParams
        const queryParamsRaw = isFunction(_queryParamsInput) ? 
          _queryParamsInput(args, readerProxy, injectProxy, callerNode, accessTracker) :
          _queryParamsInput;

        // apply transform
        const queryParams = this._transformQueryParams(queryParamsRaw);
        
        if (queryParams) {
          return {
            path: getPathRaw(args),
            queryParams
          };
        }
        else {
          return this._getPath(args, getPathRaw);
        }
      };
    }
  }

  _getPath(args, getPathRaw) {
    const path = getPathRaw(args);
    // if (this.indices) {
    //   console.warn(path, args, args.sessionId);
    // }
    if (this.indices && this.indices.doesQueryMatchAnyPropertyIndex(args)) {
      // match an index -> add index query

      // console.log({
      //   path: getPathRaw(args),
      //   indx: this.indices.getIndexNameByKeys(args)
      //   //queryParams: this.indices.where(args)
      // });
      return {
        path,
        queryParams: this.indices.where(args)
      };
    }
    
    return path;
  }

  toString() {
    return this.config.pathTemplate;
  }
}
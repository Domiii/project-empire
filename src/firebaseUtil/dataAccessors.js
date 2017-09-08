import isString from 'lodash/isString';
import initial from 'lodash/initial';
import last from 'lodash/last';
import merge from 'lodash/merge';

import { pathJoin } from 'src/util/pathUtil';
import { EmptyArray } from 'src/util';

import {
  createPathGetterFromTemplateArray
} from './dataUtil';

export function createDataAccessors(prototype, children, variableTransform) {
  // add all children
  createChildDataAccessors(prototype, children, '', variableTransform);
}

function createChildDataAccessors(prototype, children, parentPathTemplate, variableTransform) {
  if (!children) {
    return;
  }

  for (let wrapperName in children) {
    const childCfgOrPath = children[wrapperName];
    const childPath = isString(childCfgOrPath) && childCfgOrPath || (childCfgOrPath && childCfgOrPath.pathTemplate || '');
    if (!childPath) {
      // TODO: fix for groups
      continue;
    }

    // the path is the relative path from the node of given prototype to current child
    // NOTE: The path is NOT the full path.
    // NOTE2: The path for `push` is actually the path up to and including the parent only.
    const pathTemplate = pathJoin(parentPathTemplate, childPath);
    const getPath = createPathGetterFromTemplateArray(pathTemplate, variableTransform);
    const parentGetPath = createPathGetterFromTemplateArray(parentPathTemplate, variableTransform);

    if (prototype[wrapperName]) {
      throw new Error(`invalid: duplicate path name '${wrapperName}' under '${parentPathTemplate}'`);
    }

    // get
    prototype[wrapperName] = createChildDataGet(getPath);

    // add
    prototype['push_' + wrapperName] = createChildDataPush(parentGetPath);

    // set
    prototype['set_' + wrapperName] = createChildDataSet(getPath);

    // update
    prototype['update_' + wrapperName] = createChildDataUpdate(getPath);

    // batch update (add to a single bigger update, instead of sending out multiple smaller updates individually)
    prototype['batchUpdate_' + wrapperName] = createChildDataBatchUpdate(getPath);

    // delete
    prototype['delete_' + wrapperName] = createChildDataDelete(getPath);

    // keep going
    createChildDataAccessors(prototype, childCfgOrPath.children, pathTemplate);
  }
}

function _getChildPath(getPath, args, childArgs) {
  if (childArgs) {
    return getPath(...[...childArgs, ...args]);
  }
  return getPath(...args);
}

function createChildDataGet(getPath) {
  return function _get(...args) {
    const path = _getChildPath(getPath, args, this._childArgs);
    return this.getData(path);
  };
}
function createChildDataPush(getPath) {
  if (getPath.hasVariables) {
    return function _push(...args) {
      const pathArgs = initial(args);
      const data = last(args);
      const path = _getChildPath(getPath, pathArgs, this._childArgs);
      return this.pushChild(path, data);
    };
  }
  else {
    return function _push(data) {
      const path = _getChildPath(getPath, EmptyArray, this._childArgs);
      return this.pushChild(path, data);
    };
  }
}
function createChildDataSet(getPath) {
  if (getPath.hasVariables) {
    return function _set(...args) {
      const pathArgs = initial(args);
      const data = last(args);
      const path = _getChildPath(getPath, pathArgs, this._childArgs);
      return this.setChild(path, data);
    };
  }
  else {
    return function _set(data) {
      const path = _getChildPath(getPath, EmptyArray, this._childArgs);
      return this.setChild(path, data);
    };
  }
}
function createChildDataUpdate(getPath) {
  if (getPath.hasVariables) {
    return function _update(...args) {
      const pathArgs = initial(args);
      const data = last(args);
      const path = _getChildPath(getPath, pathArgs, this._childArgs);
      return this.updateChild(path, data);
    };
  }
  else {
    return function _update(data) {
      const path = _getChildPath(getPath, EmptyArray, this._childArgs);
      return this.updateChild(path, data);
    };
  }
}
function createChildDataBatchUpdate(getPath) {
  if (getPath.hasVariables) {
    return function _update(update, ...args) {
      const pathArgs = initial(args);
      const data = last(args);
      const path = _getChildPath(getPath, pathArgs, this._childArgs);
      update[path] = update[path] && merge(update[path], data) || data;
    };
  }
  else {
    return function _update(update, data) {
      const path = _getChildPath(getPath, EmptyArray, this._childArgs);
      update[path] = update[path] && merge(update[path], data) || data;
    };
  }
}
function createChildDataDelete(getPath) {
  if (getPath.hasVariables) {
    return function _delete(...args) {
      const path = _getChildPath(getPath, args, this._childArgs);
      return this.setChild(path, null);
    };
  }
  else {
    return function _delete() {
      const path = _getChildPath(getPath, EmptyArray, this._childArgs);
      return this.setChild(path, null);
    };
  }
}
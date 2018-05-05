import isPlainObject from 'lodash/isPlainObject';
import get from 'lodash/get';
import set from 'lodash/set';
import some from 'lodash/some';

export function _makePathVariable(val, varName, variableTransform) {
  if (isPlainObject(val) && variableTransform) {
    // use transformation for variable
    return variableTransform(val, varName);
  }
  return val;
}


// creates a function that plugs in path variables 
//  from a single plain object argument that names variables explicitely
export function createPathGetterFromTemplateProps(pathTemplate, variableTransform) {
  const varLookup = (props, varName, iArg) => {
    if (variableTransform) {
      return variableTransform(props, varName, iArg);
    }
    const prop = props && props[varName];
    if (prop === undefined) {
      throw new Error(`invalid arguments: ${varName} was not provided for path ${pathTemplate}`);
    }

    //return _makePathVariable(prop, varName, variableTransform);
    return prop;
  };

  const getPathWithVariables = function getPathWithVariables(props) {
    const nodeOutput = getPathWithVariables.pathInfo.nodes.map(node => node(props));
    if (some(nodeOutput, output => output === undefined)) {
      return undefined;
    }
    return nodeOutput.join('');
  };

  return createPathGetterFromTemplate(pathTemplate, varLookup, getPathWithVariables);
}


// creates a function that plugs in path variables from the function's arguments
export function createPathGetterFromTemplateArray(pathTemplate, variableTransform) {
  const varLookup = (args, varName, iArg) => {
    if (!args || iArg >= args.length) {
      //debugger;
      throw new Error(`invalid arguments: ${varName} was not provided for path ${pathTemplate}`);
    }

    return _makePathVariable(args[iArg], varName, variableTransform);
  };
  const getPathWithVariables = function getPathWithVariables(...args) {
    return getPathWithVariables.pathInfo.nodes.map(node => node(args)).join('');
  };
  return createPathGetterFromTemplate(pathTemplate, varLookup, getPathWithVariables);
}


export function createPathGetterFromTemplate(pathTemplate, varLookup, getPathWithVariables) {
  const pathInfo = parseTemplateString(pathTemplate, varLookup);
  let getPath;
  if (pathInfo.nVars > 0) {
    // template substitution from array
    getPath = getPathWithVariables;
    getPath.hasVariables = true;
  }
  else {
    // no variable substitution necessary
    getPath = function getPath() { return pathTemplate; };
    getPath.hasVariables = false;
  }
  getPath.pathInfo = pathInfo;
  getPath.pathTemplate = pathTemplate;
  return getPath;
}

/**
 * Since RegExp.exec is stateful in JS, we kinda really do NOT want to have different agents share the same re instance.
 * Creates a new instance every time instead.
 */
export const getVarRe = () => /\$\(([^)]+)\)/g;

export function getFirstVariableInPathTemplate(pathTemplate) {
  const varRe = getVarRe();
  const match = varRe.exec(pathTemplate);
  if (match) {
    return match[1];
  }
  return null;
}

// see: http://codepen.io/Domiii/pen/zNOEaO?editors=0010
export function parseTemplateString(text, varLookup) {
  text = text || '';
  let nVars = 0, nTexts = 0;
  function textNode(text) {
    ++nTexts;
    return props => text;
  }
  function varNode(varName) {
    const iVar = nVars;
    ++nVars;
    return args => {
      return varLookup(args, varName, iVar);
    };
  }

  const nodes = [];
  const varNames = [];
  let lastIndex = 0;
  let match;
  
  const varRe = getVarRe();
  while ((match = varRe.exec(text)) !== null) {
    const matchStart = match.index, matchEnd = varRe.lastIndex;
    let prevText = text.substring(lastIndex, matchStart);
    let varName = match[1];
    varNames.push(varName);

    if (prevText.length > 0) {
      nodes.push(textNode(prevText));
    }
    nodes.push(varNode(varName));

    lastIndex = matchEnd;
  }

  let prevText = text.substring(lastIndex, text.length);
  if (prevText.length > 0) {
    nodes.push(textNode(prevText));
  }

  return {
    nVars,
    nTexts,
    varNames,
    nodes
  };
}

export function createChildVarGetterFromTemplateProps(pathTemplate, varNames) {
  return props => {
    return varNames.map(varName => {
      if (!props || props[varName] === undefined) {
        //debugger;
        throw new Error(`invalid arguments: ${varName} was not provided for path ${pathTemplate}`);
      }
      return props[varName];
    });
  };
}

// convert to dot notation for lodash path access
function _convertPathToObjNotation(path) {
  path = path || '';
  path = path.toString();
  path = path.replace(/\//g, '.');
  path = path.replace(/\.\./g, '.');
  if (path[0] === '.') {
    path = path.substring(1);
  }
  return path;
}

export function getDataIn(obj, path, defaultValue = undefined) {
  path = _convertPathToObjNotation(path);

  if (!path) {
    // handle empty path separately
    // see: https://github.com/lodash/lodash/issues/3386
    if (obj === undefined) return defaultValue;
    return obj;
  }
  return get(obj, path, defaultValue);
}
export function setDataIn(obj, path, val) {
  path = _convertPathToObjNotation(path);
  if (!path) {
    // handle empty path separately
    // see: https://github.com/lodash/lodash/issues/3386
    if (obj !== undefined) {
      Object.assign(obj, val);
    }
  }
  return set(obj, path, val);
}
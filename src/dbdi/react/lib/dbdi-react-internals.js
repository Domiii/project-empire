import PropTypes from 'prop-types';

import merge from 'lodash/merge';

const dataBindNamespace = '_dbdi_';
const dataBindCustomContextName = '_customContext';
const dataSourceTreeName = '_dataSource';
export const dataBindContextStructure = {
  [dataBindNamespace]: PropTypes.shape({
    [dataSourceTreeName]: PropTypes.object.isRequired,
    [dataBindCustomContextName]: PropTypes.object
  })
};
export const dataBindRootChildContextStructure = {
  [dataBindNamespace]: PropTypes.shape({
    [dataSourceTreeName]: PropTypes.object.isRequired
  })
};
export const dataBindChildContextStructure = {
  [dataBindNamespace]: PropTypes.shape({
    [dataSourceTreeName]: PropTypes.object.isRequired,
    [dataBindCustomContextName]: PropTypes.object
  })
};

function _getDataBindContextScope(context) {
  return context[dataBindNamespace];
}


export function getDataSourceTreeFromReactContext(context) {
  const scope = _getDataBindContextScope(context);
  return scope && scope[dataSourceTreeName];
}

export function getCustomContextFromReactContext(context) {
  const scope = _getDataBindContextScope(context);
  return scope && scope[dataBindCustomContextName];
}

export function buildReactContextFromDataSourceTree(dataSourceTree, context) {
  const origCustomContext = getCustomContextFromReactContext(context);
  return Object.assign({}, {
    [dataBindNamespace]: {
      [dataSourceTreeName]: dataSourceTree,
      //[dataBindCustomContextName]: {b: 'f.'}
      [dataBindCustomContextName]: origCustomContext
    }
  });
}

export function buildReactContextForDataBind(context, customContext) {
  //const origCustomContext = getCustomContextFromReactContext(context);
  const dataSourceTree = getDataSourceTreeFromReactContext(context);
  return Object.assign({}, {
    [dataBindNamespace]: {
      [dataSourceTreeName]: dataSourceTree,
      [dataBindCustomContextName]: customContext
    }
  });
}
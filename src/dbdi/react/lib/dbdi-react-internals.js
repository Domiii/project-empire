import PropTypes from 'prop-types';

const dataBindNamespace = '_dbdi_';
const dataBindCustomContextName = '_customContext';
const dataSourceTreeName = '_dataSource';
export const dataBindContextStructure = {
  [dataBindNamespace]: PropTypes.object,
  [dataBindCustomContextName]: PropTypes.object
};
export const dataBindChildContextStructure = {
  [dataBindNamespace]: PropTypes.object,
  [dataBindCustomContextName]: PropTypes.object.isRequired
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

export function buildReactContextFromDataSourceTree(dataSourceTree, customContext) {
  return Object.assign({}, {
    [dataBindNamespace]: {
      [dataSourceTreeName]: dataSourceTree,
      [dataBindCustomContextName]: customContext
    }
  });
}
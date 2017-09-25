import PropTypes from 'prop-types';

const dataBindScopeNamespace = '_dbdi_';
const dataSourceName = '_dataSource';
export const dataBindContextStructure = {
  [dataBindScopeNamespace]: PropTypes.object
};
export const dataBindChildContextStructure = {
  [dataBindScopeNamespace]: PropTypes.object//.isRequired
};

function _getDataBindContextScope(context) {
  return context[dataBindScopeNamespace];
}


export function getDataSourceFromReactContext(context) {
  const scope = _getDataBindContextScope(context);
  return scope && scope[dataSourceName];
}

export function buildReactContextFromDataSource(dataSource) {
  return {
    [dataBindScopeNamespace]: {
      [dataSourceName]: dataSource
    }
  };
}
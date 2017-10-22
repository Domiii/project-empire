import React from 'react';
import PropTypes from 'prop-types';
import { Router, browserHistory } from 'react-router';
import { getRoutes } from './routeDefines';
import DataSourceProvider from 'src/dbdi/react/DataSourceProvider';
import dataSourceConfig from 'src/core/dataSourceConfig';

import { EmptyObject, EmptyArray } from 'src/util';

// TODO: fix this
function getState() {
  return EmptyObject;
}

export default function Root({}) {
  return (
    // ##########################################################################
    // Wrap everything in DataSourceProvider, and go!
    // ##########################################################################  
    <DataSourceProvider {...dataSourceConfig}>
      <Router history={browserHistory} routes={getRoutes(getState)} />
    </DataSourceProvider>
  );
}

Root.propTypes = {
};

import React from 'react';
import PropTypes from 'prop-types';
import { Router, browserHistory } from 'react-router';
import { getRoutes } from './routeDefines';
import DataSourceProvider from 'src/dbdi/react/DataSourceProvider';
import dataSourceTree from 'src/core/dataSourceTree';

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
    <DataSourceProvider dataSourceTree={dataSourceTree}>
      <Router history={browserHistory} routes={getRoutes(getState)} />
    </DataSourceProvider>
  );
}

Root.propTypes = {
};

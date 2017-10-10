import React from 'react';
import PropTypes from 'prop-types';
import { Router } from 'react-router';
import { getRoutes } from './routeDefines';
import DataSourceProvider from 'src/dbdi/react/DataSourceProvider';
import dataSourceConfig from 'src/core/dataSourceConfig';

export default function Root({history, store}) {
  return (
    // ##########################################################################
    // Wrap everything in DataSourceProvider, and go!
    // ##########################################################################  
    <DataSourceProvider {...dataSourceConfig}>
      <Router history={history} routes={getRoutes(store.getState)} />
    </DataSourceProvider>
  );
}

Root.propTypes = {
  history: PropTypes.object.isRequired,
  store: PropTypes.object.isRequired
};

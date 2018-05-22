import React from 'react';
import { BrowserRouter } from 'react-router-dom';

import App from './app';
import AppRoutes from './AppRoutes';
import DataSourceProvider from 'src/dbdi/react/DataSourceProvider';
import dataSourceTree from 'src/core/dataSourceTree';

export default function Root({ }) {

  return (
    // ##########################################################################
    // Wrap everything in DataSourceProvider, and go!
    // ##########################################################################  
    <DataSourceProvider dataSourceTree={dataSourceTree}>
      <BrowserRouter>

        <App>
          <AppRoutes />
        </App>
      </BrowserRouter>
    </DataSourceProvider>
  );
}

Root.propTypes = {
};

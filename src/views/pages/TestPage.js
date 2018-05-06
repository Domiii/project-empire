import buildSourceTree from 'src/dbdi/DataSourceTree';

import React, { Component } from 'react';
import dataBind from 'src/dbdi/react/dataBind';
import DataSourceProvider from 'src/dbdi/react/DataSourceProvider';
import MemoryDataProvider from 'src/dbdi/dataProviders/MemoryDataProvider';

import DBDIFormExample from 'src/dbdi/examples/DBDIFormExample';
import { NOT_LOADED } from '../../dbdi/react';

const dataProviders = {
  memory: new MemoryDataProvider()
};
const dataStructureConfig = {
  testCfg: {
    dataProvider: 'memory',
    children: {
      fetchGood: {
        path: 'fetchGood',
        async fetch() {
          await doWait(600);
          return 'good!';
        }
      },
      fetchFail1: {
        path: 'fetchFail1',
        async fetch() {
          await doWait(10);
          throw new Error('fetch MUST FAILLLLLL');
        }
      },
      fetchFail2: {
        path: 'fetchFail2',
        async fetch() {
          await doWait(50);

          // returning NOT_LOADED also triggers a failure, and will throttle following calls
          return NOT_LOADED;
        }
      },
    }
  }
};
const dataSourceTree = buildSourceTree(dataProviders, dataStructureConfig);

async function doWait(ms) {
  return new Promise((r, j) => setTimeout(r, ms));
}

@dataBind({})
class TestFetch extends Component {
  render({ }, { }, { fetchGood, fetchFail1, fetchFail1_isLoaded, fetchFail2, fetchFail2_isLoaded }) {
    return (<div>
      <p>fetchGood: {fetchGood || 'loading...'}</p>
      <p>fetchFail1: {fetchFail1_isLoaded && 'loaded!' || 'loading (not ready)...'} {fetchFail1}</p>
      <p>fetchFail2: {fetchFail2_isLoaded && 'loaded!' || 'loading (not ready)...'} {fetchFail2}</p>
    </div>);
  }
}

const WrappedView = ({ }) => (
  <DataSourceProvider dataSourceTree={dataSourceTree}>
    <TestFetch />
  </DataSourceProvider>
);

export default () => {
  return (<div>
    <WrappedView />
    <DBDIFormExample />
  </div>);
};
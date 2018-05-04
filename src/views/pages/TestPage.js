import DataSourceTree from 'src/dbdi/DataSourceTree';

import React, { Component } from 'react';
import dataBind from 'src/dbdi/react/dataBind';
import DataSourceProvider from 'src/dbdi/react/DataSourceProvider';
import MemoryDataProvider from 'src/dbdi/dataProviders/MemoryDataProvider';

import DBDIFormExample from 'src/dbdi/examples/DBDIFormExample';

const dataProviders = {
  memory: new MemoryDataProvider()
};
const dataStructureConfig = {
  testCfg: {
    dataProvider: 'memory',
    children: {
      fetchFail: {
        path: 'fetchFail',
        async fetch() {
          await doWait(10);
          throw new Error('fetch MUST FAILLLLLL');
        }
      },
      fetchGood: {
        path: 'fetchGood',
        async fetch() {
          await doWait(600);
          return 'good!';
        }
      }
    }
  }
};
const dataSourceTree = new DataSourceTree(dataProviders, dataStructureConfig);

async function doWait(ms) {
  return new Promise((r, j) => setTimeout(r, ms));
}

@dataBind({})
class TestFetch extends Component {
  render({ }, { }, { fetchFail, fetchGood, fetchFail_isLoaded }) {
    return (<div>
      <p>fetchFail: {fetchFail_isLoaded && 'loaded!' || 'not there yet (is loading) ...'} {fetchFail}</p>
      <p>fetchGood: {fetchGood || 'loading...'}</p>
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
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
    writers: {
      async testFetch(
        args,
        { fetchGood, someTestResults },
        { },
        { set_someTestResults }
      ) {
        const res = await fetchGood.readAsync();
        set_someTestResults(res);

        console.assert(res && someTestResults() === res, 'someTestResults did not get set!');
      }
    },
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
      someTestResults: 'someTestResults'
    }
  }
};

async function doWait(ms) {
  return new Promise((r, j) => setTimeout(r, ms));
}

@dataBind({})
class TestFetch extends Component {
  constructor(props) {
    super(props);

    this.dataBindMethods(
      'componentDidMount'
    );
  }

  componentDidMount(
    { },
    { testFetch }
  ) {
    testFetch();
  }

  render(
    { },
    { },
    { fetchGood, fetchFail1, fetchFail1_isLoaded, fetchFail2, fetchFail2_isLoaded, someTestResults }
  ) {
    return (<div>
      <p>fetchGood: {fetchGood || 'loading...'}</p>
      <p>fetchFail1: {fetchFail1_isLoaded && 'loaded!' || 'loading (not ready)...'} {fetchFail1}</p>
      <p>fetchFail2: {fetchFail2_isLoaded && 'loaded!' || 'loading (not ready)...'} {fetchFail2}</p>
      <p>someTestResults: {someTestResults}</p>
    </div>);
  }
}


let dataSourceTree;
const WrappedView = ({ }) => (
  <DataSourceProvider 
    dataSourceTree={dataSourceTree = 
      dataSourceTree || 
      buildSourceTree(dataProviders, dataStructureConfig)}>
    <TestFetch />
  </DataSourceProvider>
);

export default () => {
  return (<div className="container no-padding">
    <WrappedView />
    <DBDIFormExample />
  </div>);
};
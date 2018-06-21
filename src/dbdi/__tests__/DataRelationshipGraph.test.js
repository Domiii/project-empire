import buildSourceTree from '../DataSourceTree';

import React, { Component } from 'react';
import MemoryDataProvider from '../dataProviders/MemoryDataProvider';

//import { NOT_LOADED } from '../../dbdi';

let tree, dbdi;


beforeAll(() => {
  const dataProviders = {
    memory: new MemoryDataProvider()
  };
  const dataStructureConfig = {
    test: {
      dataProvider: 'memory',
      children: {
        xs: {
          path: 'xs',
          children: {
            x: {
              path: '$(xId)',

              children: {
                xName: 'xName'
              },

              hasMany: ['y']
            }
          }
        },
        ys: {
          path: 'ys',
          children: {
            y: {
              path: '$(yId)',

              children: {
                yName: 'yName'
              },

              hasMany: ['x']
            }
          }
        }
      }
    }
  };

  tree = buildSourceTree(dataProviders, dataStructureConfig);
  dbdi = tree.newAccessTracker('TESTER');
});


it('should be able to support all kinds of relationships', async () => {
  const xId1 = dbdi.write.push_x().key;
  const xId2 = dbdi.write.push_x().key;
  
  const yId1 = dbdi.write.push_y().key;
  const yId2 = dbdi.write.push_y().key;

  await dbdi.write.connectXY({xId: xId1, yId: yId1});

  expect(Object.keys(dbdi.get.xIdsOfY)).toEqual([xId1]);
  
  await dbdi.write.connectXY({xId: xId2, yId: yId1});

  expect(Object.keys(dbdi.get.xIdsOfY)).toEqual([xId1, xId2]);

  dbdi.write.disconnectXY({xId: xId2, yId: yId1});

  expect(Object.keys(dbdi.get.xIdsOfY)).toEqual([xId1]);
});
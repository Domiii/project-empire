import buildSourceTree from '../DataSourceTree';

import React, { Component } from 'react';
import MemoryDataProvider from '../dataProviders/MemoryDataProvider';

//import { NOT_LOADED } from '../../dbdi';

let tree, dbdi;


beforeAll(() => {
  delete console.log;
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
                xName: 'name'
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
                yName: 'name'
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

it('should have added all kinds of relationship readers + writers', async() => {
  expect(dbdi.read.countYsOfX).toBeTruthy();
  expect(dbdi.read.countXsOfY).toBeTruthy();
  expect(dbdi.write.connectXY).toBeTruthy();
});


it('should be able to support all kinds of relationships', async () => {
  const xId1 = dbdi.write.push_x({name: 'x1'}).key;
  expect(Object.keys(dbdi.get.xs)).toEqual([xId1]);

  const xId2 = dbdi.write.push_x({name: 'x2'}).key;
  expect(Object.keys(dbdi.get.xs)).toEqual([xId1, xId2]);
  
  const yId1 = dbdi.write.push_y({name: 'y1'}).key;
  const yId2 = dbdi.write.push_y({name: 'y1'}).key;

  await dbdi.write.connectXY({xId: xId1, yId: yId1});

  expect(Object.keys(dbdi.get.xIdsOfY)).toEqual([xId1]);
  
  await dbdi.write.connectXY({xId: xId2, yId: yId1});

  expect(Object.keys(dbdi.get.xIdsOfY)).toEqual([xId1, xId2]);

  dbdi.write.disconnectXY({xId: xId2, yId: yId1});

  expect(Object.keys(dbdi.get.xIdsOfY)).toEqual([xId1]);
});
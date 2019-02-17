import buildSourceTree from '../DataSourceTree';

import findKey from 'lodash/findKey';
import isEqual from 'lodash/isEqual';

import React, { Component } from 'react';
import MemoryDataProvider from '../dataProviders/MemoryDataProvider';
import pluralize from 'pluralize';

//import { NOT_LOADED } from '../../dbdi';

let tree, dbdi;

pluralize.addPluralRule(/x$/i, 'xs');

beforeAll(() => {
  delete console.log;
  const dataProviders = {
    memory: new MemoryDataProvider()
  };
  const dataStructureConfig = {
    test: {
      dataProvider: 'memory',
      path: '/',
      children: {
        xs: {
          path: 'xs',
          children: {
            x: {
              path: '$(xId)',

              children: {
                name: 'name'
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
                name: 'name'
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

it('should have added all kinds of relationship readers + writers', async () => {
  expect(dbdi.read.countYsOfX).toBeTruthy();
  expect(dbdi.read.countXsOfY).toBeTruthy();
  expect(dbdi.write.connectXY).toBeTruthy();
});


it('should be able to push', async () => {
  // WARNING: DO NOT REMOVE THIS LINE.
  // We currently have a big inconsistency in MemoryDataProvider:
  //    If we never actually set the parent path, "isPathFullyLoaded" returns false
  //      and it will not return anything.
  //dbdi.write.set_xs(1);

  const xId1 = await dbdi.write.push_x({ name: 'x1' }).key;
  expect(Object.keys(dbdi.get.xs)).toEqual([xId1]);

  const xId2 = await dbdi.write.push_x({ name: 'x2' }).key;
  expect(new Set(Object.keys(dbdi.get.xs))).toEqual(new Set([xId1, xId2]));
});


it('can connect keys', async () => {
  const xs = await dbdi.get.xs;

  const xId1 = findKey(xs, { name: 'x1' });
  const xId2 = findKey(xs, { name: 'x2' });

  const yId1 = await dbdi.write.push_y({ name: 'y1' }).key;
  const yId2 = await dbdi.write.push_y({ name: 'y2' }).key;

  await dbdi.write.connectXY({ xId: xId1, yId: yId1 });

  expect(dbdi.read.xIdsOfY({ yId: yId1 })).toIncludeAllMembers([xId1]);

  await dbdi.write.connectXY({ xId: xId2, yId: yId1 });

  expect(dbdi.read.xIdsOfY({ yId: yId1 })).toIncludeAllMembers([xId1, xId2]);

  expect(dbdi.read.xIdsOfY({ yId: yId2 })).toBeFalsy(); // did not touch y2

  await dbdi.write.disconnectXY({ xId: xId2, yId: yId1 });

  expect(dbdi.read.xIdsOfY({ yId: yId1 })).toIncludeAllMembers([xId1]);
});

// TODO
// countXsOfY
// anyXsOfY
// deleteAFromB
// deleteAllAsFromB
// deleteB

it('can find orphans', async () => {
  // xIdsWithoutYs
});
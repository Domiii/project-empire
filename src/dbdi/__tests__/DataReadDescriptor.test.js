// import buildSourceTree from '../DataSourceTree';

// import React, { Component } from 'react';
// import MemoryDataProvider from '../dataProviders/MemoryDataProvider';
// import pluralize from 'pluralize';

// //import { NOT_LOADED } from '../../dbdi';

// let tree, dbdi;

// pluralize.addPluralRule(/x$/i, 'xs');

// beforeAll(() => {
//   delete console.log;
//   const dataProviders = {
//     memory: new MemoryDataProvider()
//   };
//   const dataStructureConfig = {
//     test: {
//       dataProvider: 'memory',
//       children: {
//         xs: {
//           path: 'xs',
//           children: {
//             x: {
//               path: '$(xId)',

//               children: {
//                 xName: 'name'
//               },

//               hasMany: ['y']
//             }
//           }
//         },
//         ys: {
//           path: 'ys',
//           children: {
//             y: {
//               path: '$(yId)',

//               children: {
//                 yName: 'name'
//               },

//               hasMany: ['x']
//             }
//           }
//         }
//       }
//     }
//   };

//   tree = buildSourceTree(dataProviders, dataStructureConfig);
//   dbdi = tree.newAccessTracker('TESTER');
// });

// it('should support asynchronous read w/ fetch', async () => {

// });

it('should support immediate (synchronous) fetch', async () => {

});
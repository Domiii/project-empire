
// const readers = {

// };

// const writers = {
// };

// export default {
//   allLearnerStatusData: {
//     path: 'learnerStatus',
//     readers,
//     writers,
//     children: {
//       learnerStatusList: {
//         path: 'list',
//         children: {
//           learnerStatus: {
//             path: '$(uid)',
//             children: {
//               lastCompletedAt: 'lastCompletedAt',
//               latestEntry: 'learnerEntryId',
//               updatedAt: 'updatedAt',
//               createdAt: 'createdAt'
//             },
//             onWrite: [
//               'updatedAt',
//               'createdAt'
//             ]
//           }
//         }
//       }
//     }
//   }
// };
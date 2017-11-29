
export default {
  allLearnerStatusData: {
    path: 'learnerStatus',
    children: {
      learnerStatusList: {
        path: 'list',
        children: {
          learnerStatus: {
            path: '$(uid)',
            children: {
              lastCompletedAt: 'lastCompletedAt',
              latestEntry: 'learnerEntryId',
              updatedAt: 'updatedAt',
              createdAt: 'createdAt'
            },
            onWrite: [
              'updatedAt',
              'createdAt'
            ]
          }
        }
      }
    }
  }
};
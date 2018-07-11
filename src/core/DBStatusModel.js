const DBStatusModel = {
  isConnected: '.info/connected',
  current: {
    path: 'dbState/current',

    onWrite: [
      'updatedAt'
    ],

    children: {
      isLocked: 'isLocked',
      version: 'version',
      updatedAt: 'updatedAt'
    }
  }
};

export default DBStatusModel;
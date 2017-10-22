const DBStatusRef = {
  pathTemplate: '/dbState',

  methods: {
    onBeforeWrite() {
      return;
    }
  },

  children: {
    current: {
      pathTemplate: 'current',

      children: {
        isLocked: 'isLocked',
        version: 'version',
        updatedAt: 'updatedAt'
      }
    }
  }
};

export default DBStatusRef;
import { makeRefWrapper } from 'src/firebaseUtil';

const DBStatusRef  = makeRefWrapper({
  pathTemplate: '/dbState',

  methods: {
    onBeforeWrite() {
      return 
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
});

export default DBStatusRef;
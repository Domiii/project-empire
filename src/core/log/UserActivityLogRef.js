import { makeRefWrapper } from 'src/refwrappers';


const UserActivityLogRef = makeRefWrapper({
  pathTemplate: '/logs/userActivity',

  updatedAt: null,

  children: {
    entry: {
      pathTemplate: '$(entryId)',

      children: {
        page: 'page',
        args: 'args'
      }
    }
  }
});

export default UserActivityLogRef;
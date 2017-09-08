import { makeRefWrapper } from 'src/firebaseUtil';
import _ from 'lodash';


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
/**
 * Groups are organized
 */


import { 
  makeRefWrapper,
  m2mIndex
} from 'src/firebaseUtil';
import { EmptyObject, EmptyArray } from 'src/util';

import UserInfoRef from 'src/core/users/UserInfoRef';

const GroupsRef = makeRefWrapper({
  pathTemplate: '/groups',

  methods: {

  },

  children: {
    group: {
      pathTemplate: '$(groupId)',

      children: {
        title: 'title',
        description: 'description',
        isPublic: 'isPublic'
      }
    }
  }
});


export const UserGroupRef = m2mIndex(
  'userGroups',

  'user',
  'group',
  
  UserInfoRef.userList,
  GroupsRef
);

export default GroupsRef;
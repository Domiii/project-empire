/**
 * Adventures
 */


import { 
  makeRefWrapper,
  m2mIndex
} from 'src/firebaseUtil';

import { EmptyObject, EmptyArray } from 'src/util';

import UserInfoRef from 'src/core/users/UserInfoRef';

const AdventuresRef = makeRefWrapper({
  pathTemplate: '/adventures',

  methods: {

  },

  children: {
    adventure: {
      pathTemplate: '$(adventureId)',

      children: {
        assignedGMUid: 'assignedGMUid',
        missionId: 'missionId',
        guardianUid: 'guardianUid',
        adventureStatus: 'adventureStatus',

        gmNotes: 'gmNotes',
        guardianNotes: 'guardianNotes',
        partyNotes: 'partyNotes'
      }
    }
  }
});

export default AdventuresRef;

export const UserAdventureRef = m2mIndex(
  'adventureUsers',

  'user',
  'adventure',
  
  UserInfoRef.userList,
  AdventuresRef
);

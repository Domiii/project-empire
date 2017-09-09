/**
 * Adventures
 */


import { 
  makeRefWrapper,
  m2mIndex
} from 'src/firebaseUtil';

import _ from 'lodash';
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
        missionId: 'missionId',
        guardianUid: 'guardianUid',
        guardianNotes: 'guardianNotes'
      }
    }
  }
});

export default AdventuresRef;

export const MeetingsRef = {
  pathTemplate: '/meetings',
  children: {
    meeting: {
      pathTemplate: '$(meetingId)',
      children: {
        adventureId: 'adventureId',
        reviewerId: 'reviewerId',
        reviewerNotes: 'reviewerNotes',
        createdAt: 'createdAt',

        preCheckLists: {
          // each team member checks prepare prepared they are for the meeting
          pathTemplate: 'preCheckLists',
          children: {
            preCheckList: {
              pathTemplate: '$(uid)',
              children: {

              }
            }
          }
        }

      }
    }
  }
};

export const UserAdventureRef = m2mIndex(
  'adventureUsers',

  'user',
  'adventure',
  
  UserInfoRef.userList,
  AdventuresRef
);

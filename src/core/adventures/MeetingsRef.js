import { 
  makeRefWrapper
} from 'src/firebaseUtil';

import { EmptyObject, EmptyArray } from 'src/util';


export default const MeetingsRef = {
  pathTemplate: '/meetings',
  children: {
    meeting: {
      pathTemplate: '$(meetingId)',
      children: {
        adventureId: 'adventureId',
        reviewerId: 'reviewerId',
        reviewerNotes: 'reviewerNotes',
        startTime: 'startTime',
        finishTime: 'finishTime',
        meetingStatus: 'meetingStatus',

        partyMemberStatus: {
          // each party member checks how prepared they are for the meeting
          pathTemplate: 'partyMemberStatus',
          children: {
            preCheckList: {
              pathTemplate: '$(uid)',
              children: {
                prepStatus: 'prepStatus',
                checklist: {
                  pathTemplate: 'checklist',
                  children: {
                    
                  }
                }
              }
            }
          }
        },

        reviewerCheckList: {
          pathTemplate: 'reviewerCheckList',
          children: {
            // TODO: list checks
          }
        },

        results: {
          pathTemplate: 'results',
          children: {
            concludingNotes: 'concludingNotes',
            rewardNotes: 'rewardNotes'
          }
        }

      }
    }
  }
};
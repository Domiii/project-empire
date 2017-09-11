import { 
  makeRefWrapper
} from 'src/firebaseUtil';

import { EmptyObject, EmptyArray } from 'src/util';


export default MeetingsRef = {
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

        preparations: {
          // each party member checks how prepared they are for the meeting
          pathTemplate: 'preparations',
          children: {
            preparation: {
              pathTemplate: '$(uid)',
              children: {
                prepStatus: 'prepStatus',
                checklist: {
                  pathTemplate: 'checklist',
                  children: {
                    // TODO: list checks
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
        },

        usersFeedback: {
          // each party member stores feedback after the meeting
          pathTemplate: 'usersFeedback',
          children: {
            userFeedback: {
              pathTemplate: '$(uid)',
              children: {
                prepStatus: 'feedbackStatus',
                feedback: {
                  pathTemplate: 'feedback',
                  children: {
                    // TODO: list feedback options
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};
import map from 'lodash/map';
import pickBy from 'lodash/pickBy';
import isEmpty from 'lodash/isEmpty';
import mapValues from 'lodash/mapValues';

import { getFirebase } from 'react-redux-firebase';

import { 
  makeRefWrapper
} from 'src/firebaseUtil';

import { EmptyObject, EmptyArray } from 'src/util';


export const MeetingPrepStatus = {
  NotStarted: 0,
  Preparing: 1,
  Done: 2
};


export const MeetingStatus = {
  NotStarted: 0,
  InProgress: 1,
  Finished: 2
};

const activeMeetingQuery = meeting => !!meeting.active;
const inactiveMeetingQuery = meeting => !meeting.active;
const defaultActiveMeetings = Object.freeze({'': {}});

export function groupActiveMeetings(allMeetings) {
  let activeMeetings = pickBy(allMeetings, 
    activeMeetingQuery);
  activeMeetings = !isEmpty(activeMeetings) ?
    activeMeetings :
    defaultActiveMeetings;

  const archivedMeetings = pickBy(allMeetings,
    inactiveMeetingQuery);
  return [activeMeetings, archivedMeetings];
}

export function createNewMeeting(meetingsRef, adventureId) {
  return meetingsRef.push_meeting({
    startTime: getFirebase().database.ServerValue.TIMESTAMP,
    meetingStatus: MeetingStatus.NotStarted,
    adventureId,
    active: 1
  });
}

export function ensureMeetingExists(
  meetingsRef, adventureId, meetingId) {
  if (!meetingId) {
    const newEntry = createNewMeeting(meetingsRef, adventureId);
    return newEntry.then(() => newEntry.key);
  }
  return Promise.resolve(meetingId);
}

export function setMeetingPrep(
  meetingsRef, adventureId, meetingId, uid, prep) {
  return ensureMeetingExists(meetingsRef, adventureId, meetingId).
    then((_meetingId) => meetingsRef.set_preparation(_meetingId, uid, prep));
}

export function updateMeetingStatus() {
  
}

// 鑑定表： https://docs.google.com/forms/d/11Xo3VffvTtliMl4MDSY1dk3jtgGbY75doTqiRzME0Gc/edit

// TODO: 新概念der學習

export const meetingPrepItems = [
  {
    title: '簡報的準備',
    type: 'section',
    items: [
      // {
      //   // TODO:copy items from 表 (after they have been proof-read by others)

      // }
    ]
  },
  {
    title: '關於小隊任務的狀況 ',
    type: 'section',
    items: [
      {
        id: 'isFinished',
        title: '你認為：任務有沒有完成？',
        type: 'radio',
        options: [ '有！', '還沒～' ]
      },
      {
        id: 'checkedCollaborationStatus',
        title: '大家是否每週有分配好工作，並按時執行並開會確認彼此進度？',
        type: 'radio',
        options: [ '是', '否' ]
      },
      {
        id: 'goodUserUid',
        title: '請講出說：你覺得哪一個團員在執行任務之中值得你欣賞的表現？',
        description: '如果GM們認可，則你對該團員的欣賞，將會化為具體鼓勵，額外增加你的團員 Karma 值！',
        type: 'checkbox',
        options: (getValue, context) => {
          return mapValues(context.partyMembers, user => user.displayName);
        }
      },
      {
        id: 'goodUserReason',
        if: (getValue) => !!getValue('goodUserUid'),
        title: '請具體地說明原因：這個人在哪裡表現得很棒？',
        type: 'text'
      },
      {
        id: 'badUserUid',
        title: '請講出說：你覺得哪一個團員在執行任務之中造成整組的困難還是特別不願意幫忙合作？',
        description: '如果GM們也十分認同你的反映，則將會化為具體提醒，額外扣除你的團員1個Karma值！',
        type: 'checkbox',
        options: (getValue, context) => {
          return mapValues(context.partyMembers, user => user.displayName);
        } 
      },
      {
        id: 'badUserReason',
        if: (getValue) => !!getValue('badUserUid'),
        title: '請具體地說明原因：這個人在哪裡表現得很不棒？',
        type: 'text'
      },
    ],
  },
  {
    title: '關於自己在小隊任務中的狀態',
    type: 'section',
    items: [
      {
        id: 'overallFeeling',
        title: '目前對自己做任務的感覺怎樣？',
        type: 'radio',
        options: [
          '喜歡自己目前的做任務的狀況',
          '不喜歡自己目前的做任務的狀況',
          '沒什麼感覺，大家叫我做，我做就對了'
        ]
      },

      {
        id: 'engagementChange',
        title: '和上禮拜相比你做任務的投入度是上升還下降？',
        type: 'radio',
        options: [
          '我覺得我這禮拜比較投入',
          '我覺得我上禮拜比較投入',
          '沒感覺'
        ]
      },

      {
        id: 'wantsToGiveUpMission',
        title: '你目前有沒有在考慮要放棄任務？',
        type: 'radio',
        options: [
          '要，我想換任務 （注意：會扣 Karma 值）',
          '沒有要放棄～'
        ]
      },

      {
        id: 'timeManagement',
        title: '你認為自己這週的時間安排是否恰當？',
        type: 'radio',
        options: [
          '是，並且完成分工內容',
          '是，但無法如期完成分工內容',
          '否，但有完成分工內容',
          '否，因此無法完成分工內容'
        ]
      },




      // TODO: 你覺得到下次自己的表現要變嗎？改變成怎麼樣的表現？
      // TODO: 你們的作品有沒有令人驚訝的特點？

      /**

 合作 自評 + 互評:
    "Contributed to achieve the group task?"
    "Has listened to others?"
    "Was a positive influence on team moral?"
    "Had a positive expaerience?"
    "Has proactively reminded others of important deadlines?"
    "Helped extrapolated salient points from muddled contributions?"
    "Enabled shy members to contribute?"
    "Applied a technique for dealing with unproductive disharmony within the group?"
    "Has empowered others by clearing hurdles and making it easier for them to contribute?"
    "Has been fair to everyone and treated everyone as respectfully as possible?"
    "Is overall a good communicator?"
  擁抱失敗:
    "遇到困難的時候想辦法解決還是　分心　＋　想放棄？"
    "最後結果不佳的狀況下把過程當成學習機會還是崩潰？"
    "你們過程中願意多面對哪一些風險？"
  */
    ]
  }
];

export const gmMeetingGoCheckItems = {
/**
  整組的遲到狀況？
  團隊鑑定前準備了該要準備的多少 %　（團隊分工表、個人鑑定表、鑑定簡報）？
  有沒有好好把握時間（沒有在鬧）？
 */
};



const MeetingsRef = makeRefWrapper({
  pathTemplate: '/meetings',

  indices: {
    adventureId: ['adventureId']
  },

  queryString({adventureId}) {
    // get all responses by given adventureId
    return this.indices.where({adventureId});
  },

  children: {
    meeting: {
      pathTemplate: '$(meetingId)',
      children: {
        active: 'active',
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
              pathTemplate: '$(uid)'
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
                feedbackStatus: 'feedbackStatus',
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
});
export default MeetingsRef;
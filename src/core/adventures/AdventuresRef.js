/**
 * Adventures
 */


import { 
  makeRefWrapper,
  m2mIndex
} from 'src/firebaseUtil';

import { EmptyObject, EmptyArray } from 'src/util';

import UserInfoRef from 'src/core/users/UserInfoRef';

// TODO: special "Views"
//    * specialized data records (e.g. store fame/karma/gold)

// TODO: (advanced) communication system with context linkage
//    * one "checklist" (or notes) per individual (e.g. individual feedback by reviewer)

const Views = {

};

const Checklists = {
  // TODO
  partyPrepareMeeting: {},
  reviewerPrepareMeeting: {}
};

const StakeHolders = {
  none: 0,
  party: 1,
  partyMember: 2,
  reviewer: 3,
  gm: 4,
  all: 5
};

const DefaultPrivs = {
  statusRead: ['all'],  // see status of "writers" (whether writers have written or not)
  //summaryRead: ['all'], // see summary + anonymous visualizations
  read: ['party'],      // see detailed contents
  write: ['reviewer']   // fill out checklist (write data)
};

const Steps = [
  {
    id: 'prepare',
    title: '[進階] 開始執行之前的暖身開會',
    level: 2, // advanced option, only for those who want to be serious about stuff
    checklists: [
      // TODO: how to prepare for a collaborative mission properly?
    ]
  },
  {
    id: 'sprint',
    canRepeat: true,
    children: [
      {
        id: 'execution',
        title: '執行階段',
        description: '就做一做吧～',
      },
      {
        id: 'partyPrepareMeeting',
        title: '團隊鑑定的準備（團隊）',
        checklists: [
          'partyPrepareMeeting': {
            read: ['reviewer'],
            write: ['party']
          }
        ]
      },
      {
        id: 'reviewerPrepareMeeting',
        title: '團隊鑑定的準備（支持者）',
        checklists: [
          'reviewerPrepareMeeting': {
            read: ['reviewer'],
            write: ['reviewer']
          }
        ]
      },
      {
        id: 'holdMeeting',
        title: '團隊鑑定',
        checklists: [
          'reviewerMeetingRecords': {
            read: ['reviewer'],
            write: ['reviewer']
          },
          'partyMeetingRecords': {
            write: ['party']
          }
        ]
      },
      {
        id: 'postSprintReflection',
        title: '[進階] 團隊鑑定過後',
        level: 2,
        checklists: [
          'reviewerPostSpringReflection': {
            read: ['all'],
            write: ['reviewer']
          },
          'partyPostSpringReflection': {
            write: ['party']
          }
        ]
      },
      {
        // type: 'stepChoice',
        // decisionMaker: 'reviewer', // TODO: party voting?
        next: [
          'sprint',
          'finish'
        ]
      }
    ]
  },
  {
    id: 'finish'
    // TODO
  }
];

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

/**
 * Projects
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

export const StageStatus = {
  None: 0,
  NotStarted: 1,
  Started: 2,
  Finished: 3,
  Failed: 4
};

export const ProjectStages = [
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
    title: 'Sprint',
    canRepeat: true,
    children: [
      {
        id: 'execution',
        title: '執行階段',
        description: '就做一做～',
        noStatus: true
      },
      {
        id: 'partyPrepareMeeting',
        title: '團隊 準備 團隊鑑定',
        checklists: [
          {
            id: 'partyPrepareMeeting',
            read: ['reviewer'],
            write: ['party']
          }
        ]
      },
      {
        id: 'reviewerPrepareMeeting',
        title: '支持者 準備 團隊鑑定',
        checklists: [
          {
            id: 'reviewerPrepareMeeting',
            read: ['reviewer'],
            write: ['reviewer']
          }
        ]
      },
      {
        id: 'holdMeeting',
        title: '團隊鑑定',
        checklists: [
          {
            id: 'reviewerMeetingRecords',
            read: ['reviewer'],
            write: ['reviewer']
          },
          {
            id: 'partyMeetingRecords',
            write: ['party']
          }
        ]
      },
      {
        id: 'postSprintReflection',
        title: '[進階] 團隊鑑定過後',
        level: 2,
        checklists: [
          {
            id: 'reviewerPostSpringReflection',
            read: ['all'],
            write: ['reviewer']
          },
          {
            id: 'partyPostSpringReflection',
            write: ['party']
          }
        ]
      },
      {
        // type: 'stepChoice',
        // decisionMaker: 'reviewer', // TODO: party voting?
        next: [
          'sprint',
          'wrapup'
        ]
      }
    ]
  },
  {
    id: 'wrapup',
    title: '專案總點：一起思考過程喜歡與不喜歡的～'
  }
];

const ProjectsRef = makeRefWrapper({
  pathTemplate: '/projects',

  methods: {

  },

  children: {
    project: {
      pathTemplate: '$(projectId)',

      children: {
        assignedGMUid: 'assignedGMUid',
        missionId: 'missionId',
        guardianUid: 'guardianUid',
        projectStatus: 'projectStatus',

        gmNotes: 'gmNotes',
        guardianNotes: 'guardianNotes',
        partyNotes: 'partyNotes'
      }
    }
  }
});

export default ProjectsRef;

export const UserProjectRef = m2mIndex(
  'projectUsers',

  'user',
  'project',
  
  UserInfoRef.userList,
  ProjectsRef
);

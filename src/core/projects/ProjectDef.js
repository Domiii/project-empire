import { StageDefTree } from './ProjectTree';

import isArray from 'lodash/isArray';




function isUserInGroup(user, groupName) {

}

function isCurrentUserInGroup(user, groupName) {

}

function getStageStakeHolders(groups, count) {
  // TODO: support multiple sets of "stake holders"

}

function contributorSet(groupName, signOffCount) {
  return { 
    groupName,
    signOffCount
  };
}

export const ContributorGroup = {
  none: 0,
  party: 1,
  reviewer: 2,
  gm: 3,
  any: 4
};

export const DefaultPrivs = {
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

export const ProjectStageTree = new StageDefTree([
  {
    id: 'prepare',
    title: '[進階] 開始執行之前的暖身開會',
    level: 2, // advanced option, only for those who want to be serious about stuff
    checklists: [
      // TODO: how to prepare for a collaborative mission properly?
    ],
    contributors: contributorSet('party', 1)
  },
  {
    id: 'sprint',
    title: 'Sprint',
    isLoop: true,
    children: [
      {
        id: 'execution',
        title: '執行階段',
        contributors: contributorSet('party'),
        description: '就做一做～',
        noStatus: true
      },
      {
        id: 'partyPrepareMeeting',
        title: '團隊 準備 團隊鑑定',
        contributors: contributorSet('party'),
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
        contributors: contributorSet('reviewer'),
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
        contributors: contributorSet('reviewer'),
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
        contributors: contributorSet('party'),
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
      }
    ]
  },
  {
    id: 'wrapup',
    title: '專案總點：一起思考過程喜歡與不喜歡的～',
    contributors: contributorSet('party', 1)
  }
]);

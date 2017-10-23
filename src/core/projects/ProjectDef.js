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

export const ContributorGroupNames = {
  none: 0,
  any: 1,
  party: 2,
  reviewer: 3,
  gm: 4
};

export const DefaultPrivs = {
  statusRead: ['all'],  // see status of "writers" (whether writers have written or not)
  //summaryRead: ['all'], // see summary + anonymous visualizations
  read: ['party'],      // see detailed contents
  write: ['reviewer']   // fill out checklist (write data)
};

export const ProjectStatus = {
  None: 0,
  //NotStarted: 1,
  Started: 2,
  Finished: 3,
  Failed: 4,
  Cancelled: 5
};

export function isProjectStatusOver(projectStatus) {
  return projectStatus >= ProjectStatus.Finished;
}

export const StageStatus = {
  None: 0,
  //NotStarted: 1,
  Started: 2,
  Finished: 3,
  Failed: 4
};

/**
 * Whether given stage status is Failed or Finished
 */
export function isStageStatusOver(stageStatus) {
  return stageStatus >= StageStatus.Finished;
}

export const StageContributorStatus = {
  None: 0,
  //NotStarted: 1,
  Started: 2,
  Finished: 3,
  Failed: 4
};

/**
 * Whether given contributor status is Failed or Finished
 */
export function isStageContributorStatusOver(contributorStatus) {
  return contributorStatus >= StageContributorStatus.Finished;
}

export const projectStageTree = new StageDefTree([
  {
    id: 'prepare',
    title: '[進階] 開始執行之前的暖身開會',
    level: 2, // advanced option, only for those who want to be serious about stuff
    forms: [
      // TODO: how to prepare for a collaborative mission properly?
    ],
    contributors: contributorSet('party', 1)
  },
  {
    id: 'sprint',
    title: 'Sprint',
    isRepeatable: true,
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
        forms: [
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
        contributors: contributorSet('reviewer', 1),
        forms: [
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
        contributors: contributorSet('reviewer', 1),
        forms: [
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
        id: 'sprintWrapup',
        title: '🏁 Sprint 的終點 🏁',
        contributors: contributorSet('party'),
        level: 2,
        forms: [
          {
            id: 'reviewerSprintWrapup',
            read: ['all'],
            write: ['reviewer']
          },
          {
            id: 'partySprintWrapup',
            write: ['party']
          }
        ]
      }
    ]
  },
  {
    id: 'wrapup',
    title: '專案終點：一起思考過程喜歡與不喜歡的～',
    contributors: [contributorSet('party', 1), contributorSet('reviewer', 1)]
  }
]);

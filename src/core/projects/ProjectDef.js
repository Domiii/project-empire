import { StageDefTree } from './ProjectTree';

import isArray from 'lodash/isArray';



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
    title: '專案起點',
    level: 2, // advanced option, only for those who want to be serious about stuff
    forms: [
      // TODO: how to prepare for a collaborative mission properly?
    ],
    contributors: contributorSet('party', 1)
  },
  {
    id: 'milestoneMeeting',
    title: 'MM',
    isRepeatable: true,
    contributors: [contributorSet('party'), contributorSet('reviewer', 1)],
    forms: [
      {
        id: 'projectMeeting',
        read: ['party'],
        write: ['reviewer']
      }
    ]
  },
  {
    id: 'wrapup',
    shortTitle: '🏁 專案終點 🏁',
    title: '專案終點：一起反思過程',
    contributors: [contributorSet('party', 1), contributorSet('reviewer', 1)]
  }
]);

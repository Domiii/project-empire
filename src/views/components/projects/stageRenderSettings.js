
import {
  projectStageTree,
  StageStatus,
  StageContributorStatus,
  isStageStatusOver
} from 'src/core/projects/ProjectDef';

export const stageStatusStyles = {
  [StageStatus.None]: {
    color: 'gray'
  },
  [StageStatus.NotStarted]: {
    color: 'gray'
  },
  [StageStatus.Started]: {
    color: 'blue'
  },
  [StageStatus.Finished]: {
    color: 'green'
  },
  [StageStatus.Failed]: {
    color: 'red'
  }
};

export const contributorStatusStyles = {
  [StageContributorStatus.None]: {
    color: 'gray'
  },
  [StageContributorStatus.NotStarted]: {
    color: 'gray'
  },
  [StageContributorStatus.Started]: {
    color: 'blue'
  },
  [StageContributorStatus.Finished]: {
    color: 'green'
  },
  [StageContributorStatus.Failed]: {
    color: 'red'
  }
};

export const constributorStatusIcons = {
  [StageContributorStatus.None]: {
    name: 'question'
  },
  [StageContributorStatus.NotStarted]: {
    name: 'question'
  },
  [StageContributorStatus.Started]: {
    name: 'repeat'
  },
  [StageContributorStatus.Finished]: {
    name: 'check'
  },
  [StageContributorStatus.Failed]: {
    name: 'remove'
  }
};

export const stageStatusBsStyles = {
  [StageStatus.None]: 'info',
  [StageStatus.NotStarted]: 'default',
  [StageStatus.Started]: 'primary',
  [StageStatus.Finished]: 'success',
  [StageStatus.Failed]: 'danger'
};



import {
  projectStageTree
} from 'src/core/projects/ProjectDef';

import { EmptyObject } from 'src/util';
import { getOptionalArguments } from 'src/dbdi/dataAccessUtil';

import readers from './readers';
import writers from './writers';

/**
 * Project main data
 */
const projectById = {
  path: '$(projectId)',
  onWrite: [
    'updatedAt',
    'createdAt'
  ],
  children: {
    projectMissionId: 'missionId',

    // only one reviewer (GM) for now
    projectReviewerUid: 'reviewerUid',

    projectGuardianUid: 'guardianUid',

    activeStagePath: {
      path: 'activeStagePath',

      reader(res) {
        if (res === undefined) return res;
        return !res && projectStageTree.root.firstChild.stageId || res;
      },
    },

    projectStatus: 'status',
    projectFinishTime: 'finishTime'
  }
};

const stageEntries = {
  path: 'stageEntries',
  children: {
    stageEntry: {
      path: '$(stagePath)',
      children: {
        stageStatusRaw: {
          path: 'status'
        },
        stageStartTime: 'startTime',
        stageFinishTime: 'finishTime'
      }
    }
  }
};

const allStageFormsData = {
  path: 'allStageFormData',
  children: {
    stageFormsData: {
      path: '$(stagePath)',
      children: {
        stageFormData: '$(formName)/$(uid)'
      }
    }
  }
};

const allStageContributions = {
  path: 'contributions',
  children: {
    stageContributions: {
      path: '$(stagePath)',
      children: {
        stageContribution: {
          path: '$(uid)',
          onWrite: [
            'createdAt',
            'updatedAt'
          ],
          children: {
            /**
             * The contributor status as stored in DB
             */
            stageContributorStatusRaw: 'status',
            stageContributorData: 'data'
          }
        }
      }
    }
  }
};

const projectsPageCfg = {

};

export default {
  projectUidIndex: {
    path: '/_index/projectUsers/project',
    children: {
      uidsOfProject: {
        path: '$(projectId)',
        reader(res) {
          return res === null ? EmptyObject : res;
        },
        children: {
          uidOfProject: '$(uid)'
        }
      }
    }
  },
  userProjectIdIndex: {
    path: '/_index/projectUsers/user',
    children: {
      activeProjectIdsOfUser: {
        path: '$(uid)',
        reader(res) {
          return res === null ? EmptyObject : res;
        },
        children: {
          activeProjectIdOfUser: '$(projectId)'
        }
      }
    }
  },
  allProjectData: {
    path: '/projects',
    readers,
    writers,
    children: {
      projectList: {
        path: 'list',
        children: {
          projectsOfPage: {
            path: {
              queryParams(args) {
                const {
                  page
                } = args;

                const {
                  orderBy,
                  itemsPerPage,
                  ascending
                } = getOptionalArguments(args, {
                    orderBy: 'updatedAt',
                    itemsPerPage: 20,
                    ascending: false
                  });

                return [
                  ['orderByChild', orderBy],
                  [ascending ? 'limitToFirst' : 'limitToLast', page * itemsPerPage]
                ];
              }
            }
          },
          projectById
        }
      },
      allProjectStages: {
        path: 'stages',
        children: {
          projectStages: {
            path: '$(projectId)',
            children: {
              stageEntries,
              allStageFormsData,
              allStageContributions
            }
          }
        }
      },
    }
  }
};

import {
  projectStageTree
} from 'src/core/projects/ProjectDef';

import { EmptyObject } from 'src/util';
import { getOptionalArguments } from 'src/dbdi/dataAccessUtil';

import readers from './readers';
import writers from './writers';


/**
 * user roles: owner + supporting user roles in projects
 * seriousness of project/and participants
 * 每週分享狀態
 * length/output/efficiency/value of project?
 * timeline of project / of all projects
 * active vs. archived projects
 */

/**
 * Project main data
 */
const projectById = {
  path: '$(projectId)',
  onWrite: [
    'updatedAt',
    'createdAt',
    function setCreator(queryArgs, val,
      {},
      {currentUid}
    ) {
      val && !val.creatorUid && (val.creatorUid = currentUid);
    }
  ],
  children: {
    projectTitle: 'title',
    projectDescription: 'description',

    // icon URL
    projectIconUrl: 'iconUrl',

    // the person guarding/watching over this project/helping the project succeed
    projectCreatorUid: 'creatorUid',

    projectStatus: 'status',
    projectFinishTime: 'finishTime'

    // activeStagePath: {
    //   path: 'activeStagePath',

    //   reader(res) {
    //     if (res === undefined) return res;
    //     return !res && projectStageTree.root.firstChild.stageId || res;
    //   },
    // },
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
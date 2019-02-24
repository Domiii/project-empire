
import {
  projectStageTree
} from 'src/core/projects/ProjectDef';

import { EmptyObject } from 'src/util';

import readers from './readers';
import writers from './writers';
import paginationNodes from 'dbdi/paginationNodes';

/**
 * Project main data
 */
const projectById = prefix => ({
  path: '$(projectId)',
  onWrite: [
    'updatedAt',
    'createdAt',
    function setCreator(queryArgs, val, originalVal, actionName,
      { },
      { currentUid }
    ) {
      val && !val.creatorUid && (val.creatorUid = currentUid);
    }
  ],
  children: {
    [prefix + 'projectTitle']: 'title',
    [prefix + 'projectDescription']: 'description',

    // icon URL
    [prefix + 'projectIconUrl']: 'iconUrl',

    // the person guarding/watching over this project/helping the project succeed
    [prefix + 'projectCreatorUid']: 'creatorUid',

    [prefix + 'projectStatus']: 'status',
    [prefix + 'projectFinishTime']: 'finishTime'

    // activeStagePath: {
    //   path: 'activeStagePath',

    //   reader(res) {
    //     if (res === undefined) return res;
    //     return !res && projectStageTree.root.firstChild.stageId || res;
    //   },
    // },
  }
});

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
    path: 'projects',
    readers,
    writers,
    children: {
      projectList: {
        path: 'list',
        readers: {
          projectById(args, { project }) {
            return project(args);
          }
        },
        children: {
          ...paginationNodes('projectsOfPage'),
          project: {
            ...projectById(''),
            writers: {
              archiveProject() {
                // TODO
              }
            }
          }
        }
      },
      projectArchive: {
        path: 'archive',
        children: {
          ...paginationNodes('archivedProjectsOfPage'),
          archivedProjectById: {
            ...projectById('archived_'),
            writers: {
              unarchiveProject() {
                // TODO
              }
            }
          }
        }
      },
      // allProjectStages: {
      //   path: 'stages',
      //   children: {
      //     projectStages: {
      //       path: '$(projectId)',
      //       children: {
      //         stageEntries,
      //         allStageFormsData,
      //         allStageContributions
      //       }
      //     }
      //   }
      // },
    }
  }
};
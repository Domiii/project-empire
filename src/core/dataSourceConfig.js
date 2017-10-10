import ProjectDataConfig from 'src/core/projects/ProjectDataConfig';
import UserDataConfig from 'src/core/users/UserDataConfig';

import dataProviders from './dataProviders.js';

import merge from 'lodash/merge';

const dataStructureConfig = {
  auth: {
    dataProvider: 'firebaseAuth',
    children: {
      currentUser: '',
      currentUid: 'uid'
    }
  },
  db: {
    dataProvider: 'firebase',
    children: merge({},
      ProjectDataConfig,
      UserDataConfig,
      {
        missions: {
          path: 'missions',
          children: {
            mission: '$(missionId)'
          }
        }
      }
    )
  }
};



export default {
  dataProviders,
  dataStructureConfig
};
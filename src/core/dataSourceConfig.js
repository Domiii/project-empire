import firebase from 'firebase';

import ProjectModel from 'src/core/projects/ProjectModel';
import UserModel from 'src/core/users/UserModel';
import MissionModel from 'src/core/missions/MissionModel';

import dataProviders from './dataProviders.js';

import merge from 'lodash/merge';

const dataStructureConfig = {
  auth: {
    dataProvider: 'firebaseAuth',
    children: {
      currentUserAuthData: '',
      currentUid: 'uid'
    }
  },
  db: {
    dataProvider: 'firebase',
    path: '/',
    children: merge({},
      UserModel,
      MissionModel,
      ProjectModel,
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

const plugins = {
  onWrite: {
    createdAt(queryArgs, val) {
      val && !val.createdAt && (val.createdAt = firebase.database.ServerValue.TIMESTAMP);
    },
    updatedAt(queryArgs, val) {
      val && (val.updatedAt = firebase.database.ServerValue.TIMESTAMP);
    }
  }
};



export default {
  dataProviders,
  dataStructureConfig,
  plugins
};
import firebase from 'firebase';

import ProjectModel from 'src/core/projects/projectModel';
import UserModel from 'src/core/users/UserModel';
import MissionModel from 'src/core/missions/MissionModel';
import ScheduleModel from 'src/core/missions/ScheduleModel';

import dataProviders from './dataProviders.js';

import map from 'lodash/map';
import merge from 'lodash/merge';
import times from 'lodash/times';
import zipObject from 'lodash/zipObject';

import DataSourceTree from 'src/dbdi/DataSourceTree';

const utility = {
  // readers: {
  //   failIfNotLoaded({ readers }) {
  //     return 
  //   }
  // },

  writers: {
    updateAll(
      { pathArgs, readers, val }, { }, { }, { update_db }
    ) {
      console.log(readers.length, times(readers.length, val));
      const updateObj = zipObject(
        map(readers, reader => reader.getPath(pathArgs)),
        times(readers.length, () => val)
      );
      return update_db(updateObj);
    }
  }
};

const dataStructureConfig = {
  utility,
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
      ScheduleModel,
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

export default new DataSourceTree(dataProviders, dataStructureConfig, plugins);

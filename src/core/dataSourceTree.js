import firebase from 'firebase';

import UserModel from 'src/core/users/UserModel';

import LearnerKBModel from 'src/core/scaffolding/LearnerKBModel';
import LearnerScheduleModel from 'src/core/scaffolding/LearnerScheduleModel';
import LearnerEntryModel from 'src/core/scaffolding/LearnerEntryModel';

import GoalModel from 'src/core/goals/GoalModel';

import PlaceModel from 'src/core/places/PlaceModel';
import CohortModel from 'src/core/cohorts/CohortModel';
import ProjectModel from 'src/core/projects/projectModel';
import MissionModel from 'src/core/missions/MissionModel';

import StreamModel from 'src/core/multimedia/StreamModel';
import StreamFileModel from 'src/core/multimedia/StreamFileModel';
import YouTubeAPIModel from 'src/core/multimedia/YouTubeAPIModel';

import dataProviders from './dataProviders.js';

import { lookupLocalized } from 'src/util/localizeUtil';

import map from 'lodash/map';
import merge from 'lodash/merge';
import times from 'lodash/times';
import zipObject from 'lodash/zipObject';

import DataSourceTree from 'src/dbdi/DataSourceTree';
import { NOT_LOADED } from '../dbdi/react/index.js';

const utility = {
  readers: {
    // failIfNotLoaded({ readers }) {
    //   return 
    // }
    lookupLocalized({ obj, prop }, { }, { currentUser }) {
      const lang = currentUser && currentUser.locale || 'en';
      return lookupLocalized(lang, obj, prop);
    }
  },

  writers: {
    updateAll(
      { pathArgs, readers, val }, 
      { },
      { }, 
      { update_db }
    ) {
      //console.log(readers.length, times(readers.length, val));
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

      CohortModel,
      
      LearnerScheduleModel,
      GoalModel,

      // unused...
      PlaceModel,
      MissionModel,
      ProjectModel,

      LearnerKBModel,
      LearnerEntryModel
    )
  },
  localData: {
    dataProvider: 'memory',
    path: '/localData',
    children: merge({},
      StreamModel,
      StreamFileModel,
      YouTubeAPIModel
    )
  }
};

const plugins = {
  onWrite: {
    createdAt(queryArgs, val, originalVal, actionName) {
      if (val === null || val === undefined) {
        // deleting this entry
        return;
      }

      switch (actionName) {
        case 'push':
          // new entry
          val.createdAt = firebase.database.ServerValue.TIMESTAMP;
        break;
        case 'set':
          // check old entry
          val.createdAt = originalVal && originalVal.createdAt || firebase.database.ServerValue.TIMESTAMP;
        break;
        default:
        // do nothing
        // NOTE: updates are not properly handled at this time since they need a more global approach.
        //     For updates, we need to identify the actual node each entry in the update object writes to.
        break;
      }
    },
    updatedAt(queryArgs, val, originalVal, actionName) {
      val && (val.updatedAt = firebase.database.ServerValue.TIMESTAMP);
    }
  }
};

export default new DataSourceTree(dataProviders, dataStructureConfig, plugins);

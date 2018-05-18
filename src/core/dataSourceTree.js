import firebase from 'firebase';

import CohortModel from './cohorts/CohortModel';
import UserModel from './users/UserModel';

import StreamModel from './multimedia/StreamModel';
import StreamFileModel from './multimedia/StreamFileModel';
import YtApiModel from './multimedia/youtube/YtApiModel';

import LearnerScheduleModel from './scaffolding/LearnerScheduleModel';
import ProjectModel from './projects/projectModel';
import PresentationModels from './presentations';
import SimulatorModel from './testing/SimulatorModel';

// import LearnerKBModel from './scaffolding/LearnerKBModel';
// import LearnerEntryModel from './scaffolding/LearnerEntryModel';

// import GoalModel from './goals/GoalModel';

// import PlaceModel from './places/PlaceModel';
// import MissionModel from './missions/MissionModel';

import dataProviders from './dataProviders.js';

import { lookupLocalized } from 'src/util/localizeUtil';

import map from 'lodash/map';
import merge from 'lodash/merge';
import times from 'lodash/times';
import zipObject from 'lodash/zipObject';

import buildSourceTree from 'src/dbdi/DataSourceTree';

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

const dataModelConfig = {
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
    children: merge({
      isConnected: '.info/connected'
    },
      UserModel,

      CohortModel,
      
      LearnerScheduleModel,
      ProjectModel,
      PresentationModels,

      SimulatorModel

      //GoalModel,

      // unused...
      // PlaceModel,
      // MissionModel,

      // LearnerKBModel,
      // LearnerEntryModel
    )
  },
  localData: {
    dataProvider: 'memory',
    path: '/localData',
    children: merge({},
      StreamModel,
      StreamFileModel,
      YtApiModel
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
        case 'set':
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

export default buildSourceTree(dataProviders, dataModelConfig, plugins);

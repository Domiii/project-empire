import map from 'lodash/map';
import filter from 'lodash/filter';

import paginationNodes from 'src/dbdi/nodes/paginationNodes';
import { downloadSpreadsheetJSON } from '../../util/SpreadsheetUtil';
import { PresentationStatus } from './PresentationModel';
import { Promise } from 'firebase';

export default {
  presentationSessionData: {
    path: 'presentationSessions',

    readers: {

    },

    writers: {
      newPresentationSession(
        { },
        { },
        { },
        { push_presentationSession,
          set_livePresentationSessionId }
      ) {
        // create new session
        const sessionId = push_presentationSession({}).key;

        // create new set of presentations

        // set live id
        set_livePresentationSessionId(sessionId);
        return sessionId;
      },

      /**
       * Import presentations from Google spreadsheet
       */
      async importPresentationsToSession(
        { sessionId, publishId, gid },
        {},
        { currentUid },
        { push_presentation }
      ) {
        const csvOptions = {
          columnArrIndex: 4,
          columnArrName: 'userNames'
        };

        let presis = await downloadSpreadsheetJSON(publishId, gid, csvOptions);

        presis = filter(presis, p => p.title || p.userNames);

        const promises = map(presis, (pres, i) => {
          pres.sessionId = sessionId;
          pres.index = i;
          pres.presentationStatus = PresentationStatus.Pending;
          pres.creatorUid = currentUid;

          return push_presentation(pres);
        });

        return await Promise.all(promises);

        /*
              sessionId: 'sessionId', // the session this presentation belongs to
              index: 'index', // the order during the session

              presentationStatus: 'presentationStatus',
              creatorUid: 'creatorUid', // the user who started this presentation
              fileId: 'fileId', // local filesystem fileId (file only available to creator on the device + browser they used to record it with)
              videoId: 'videoId', // youtube videoId (once uploaded)

              title: 'title',
              commentText: 'commentText'*/
      }
    },

    children: {
      // The session that is currently in progress
      livePresentationSessionId: 'livePresentationSessionId',

      presentationSessions: {
        path: 'list',

        children: {
          ...paginationNodes('presentationSessionsOfPage', 'sortedPresentationSessionsIdsOfPage'),

          presentationSession: {
            path: '$(sessionId)',

            hasMany: [
              'presentation'
            ],

            onWrite: [
              'createdAt',
              'updatedAt'
            ],

            children: {
              finishTime: 'finishTime',
              playlistId: 'playlistId'
            }
          }
        }
      }
    }
  }
};
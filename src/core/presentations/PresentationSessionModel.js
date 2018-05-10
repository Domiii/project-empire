import map from 'lodash/map';
import filter from 'lodash/filter';
import find from 'lodash/find';

import paginationNodes from 'src/dbdi/nodes/paginationNodes';
import { downloadSpreadsheetJSON } from '../../util/SpreadsheetUtil';
import { PresentationStatus } from './PresentationModel';
import { Promise } from 'firebase';


const sessionReaders = {
  isPresentationSessionInProgress(args, { presentationSessionStreamerUid }, { }) {
    return !!presentationSessionStreamerUid(args);
  },

  isPresentationSessionOwner(args, { presentationSessionStreamerUid }, { currentUid }) {
    return currentUid && presentationSessionStreamerUid(args) === currentUid;
  }
};

const sessionWriters = {
  /**
   * Import presentations from Google spreadsheet
   */
  async importPresentationsToSession(
    { sessionId, publishId, gid },
    { },
    { currentUid },
    { push_presentation }
  ) {
    const csvOptions = {
      columnArr: {
        start: 4,
        end: 8,
        name: 'userNames'
      }
    };

    let presis = await downloadSpreadsheetJSON(publishId, gid, csvOptions);

    presis = filter(presis, p => p.title || p.userNames);

    const promises = map(presis, (pres, i) => {
      pres.sessionId = sessionId;
      pres.index = i;
      pres.presentationStatus = PresentationStatus.Pending;
      pres.creatorUid = currentUid;
      pres.userNamesString = (pres.userNames || []).join('\t');

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
  },

  startPresentationSessionStreaming(
    args,
    { },
    { currentUid },
    { set_presentationSessionStreamerUid, goToFirstPendingPresentationInSession, startStreamRecording }
  ) {
    set_presentationSessionStreamerUid(args, currentUid);
    const res = goToFirstPendingPresentationInSession(args);
    if (res) {
      startStreamRecording({ streamId: args.sessionId });
    }
  },

  stopPresentationSessionStreaming(
    args,
    { presentationSessionStreamerUid },
    { currentUid },
    { set_presentationSessionStreamerUid }
  ) {
    if (currentUid && currentUid === presentationSessionStreamerUid(args)) {
      set_presentationSessionStreamerUid(args, null);
    }
  },

  finishPresentationSessionStreaming(
    sessionArgs,
    { presentationSessionActivePresentationId },
    { },
    { setActivePresentationInSession, update_presentation, goToFirstPendingPresentationInSession, startStreamRecording }
  ) {
    const presentationId = presentationSessionActivePresentationId(sessionArgs);
    if (presentationId) {
      const presentationArgs = { presentationId };
      update_presentation(presentationArgs, {
        presentationStatus: PresentationStatus.Finished,
        finishTime: new Date().getTime()
      });

      const { sessionId } = sessionArgs;

      if (!goToFirstPendingPresentationInSession(sessionArgs)) {
        setActivePresentationInSession({ sessionId, presentationId: null });
      }
      else {
        // reset stream
        startStreamRecording({ streamId: sessionId });
      }
    }
  },

  goToFirstPendingPresentationInSession(
    { sessionId },
    { orderedPresentations },
    { },
    { setActivePresentationInSession }
  ) {
    const sessionArgs = { sessionId };
    const presentations = orderedPresentations(sessionArgs);
    const firstPendingPres = find(presentations, p => p.presentationStatus <= PresentationStatus.InProgress);
    if (firstPendingPres) {
      const presentationId = firstPendingPres.id;
      return setActivePresentationInSession({ sessionId, presentationId });
    }
    return null;
  },

  setActivePresentationInSession(
    { sessionId, presentationId },
    { presentationStatus, presentationFileId, presentationSessionActivePresentationId },
    { },
    { update_db, set_streamFileId }
  ) {
    const sessionArgs = { sessionId };
    const updates = {
      [presentationSessionActivePresentationId.getPath(sessionArgs)]: presentationId
    };
    if (presentationId) {
      const presentationArgs = { presentationId };
      Object.assign(updates, {
        [presentationStatus.getPath(presentationArgs)]: PresentationStatus.InProgress,
        [presentationFileId.getPath(presentationArgs)]: presentationId
      });
    }

    // must make this update separate because that goes to a different DataProvider (MemoryDataProvider),
    // and (for now) update_db only uses the single DataProvider at the root
    const streamArgs = { streamId: sessionId };
    set_streamFileId(streamArgs, presentationId);

    const activePresId = presentationSessionActivePresentationId(sessionArgs);
    if (activePresId && activePresId !== presentationId &&
      presentationStatus({ presentationId: activePresId }) === PresentationStatus.InProgress) {
      // set active presentation back to "Pending"
      updates[presentationStatus.getPath({ presentationId: activePresId })] = PresentationStatus.Pending;
    }

    return update_db(updates);
  }
};

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

            readers: sessionReaders,

            writers: sessionWriters,

            children: {
              presentationSessionStreamerUid: 'presentationSessionStreamerUid',
              presentationSessionActivePresentationId: 'presentationSessionActivePresentationId',
              finishTime: 'finishTime',
              ytPlaylistId: 'ytPlaylistId',
            }
          }
        }
      }
    }
  }
};
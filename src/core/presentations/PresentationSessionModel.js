import map from 'lodash/map';
import forEach from 'lodash/forEach';
import filter from 'lodash/filter';
import find from 'lodash/find';
import findLast from 'lodash/findLast';

import paginationNodes from 'src/dbdi/nodes/paginationNodes';
import { downloadSpreadsheetJSON } from '../../util/SpreadsheetUtil';
import { PresentationStatus } from './PresentationModel';
import { Promise } from 'firebase';


const sessionReaders = {
  isPresentationSessionInProgress(args, { presentationSessionOperatorUid }, { }) {
    return !!presentationSessionOperatorUid(args);
  },

  isPresentationSessionOperator(args, { presentationSessionOperatorUid }, { currentUid }) {
    return currentUid && presentationSessionOperatorUid(args) === currentUid;
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
        end: 7,
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

  addNewPresentation(
    sessionArgs,
    { },
    { },
    { orderedPresentations, push_presentation }
  ) {
    const presentations = orderedPresentations(sessionArgs);
    const lastPres = findLast(presentations, { presentationStatus: PresentationStatus.Pending });
    const index = lastPres && lastPres.index + 0.00001 || 0;
    const newPres = {
      index,
      presentationStatus: PresentationStatus.Pending
    };
    push_presentation(newPres);
  },

  startPresentationSessionStreaming(
    args,
    { },
    { currentUid },
    { set_presentationSessionOperatorUid, goToFirstPendingPresentationInSession, startStreamRecording }
  ) {
    set_presentationSessionOperatorUid(args, currentUid);
    const res = goToFirstPendingPresentationInSession(args);
    if (res) {
      startStreamRecording({ streamId: args.sessionId });
    }
  },

  stopPresentationSessionStreaming(
    args,
    { presentationSessionOperatorUid },
    { currentUid },
    { set_presentationSessionOperatorUid }
  ) {
    if (currentUid && currentUid === presentationSessionOperatorUid(args)) {
      set_presentationSessionOperatorUid(args, null);
    }
  },

  async skipPresentationInSession(
    sessionArgs,
    { presentationSessionActivePresentationId },
    { },
    { finishPresentationSession, update_presentation, goToFirstPendingPresentationInSession, startStreamRecording }
  ) {
    const presentationId = presentationSessionActivePresentationId(sessionArgs);
    if (presentationId) {
      const presentationArgs = { presentationId };
      //const presentation = get_presentation(presentationArgs);
      await update_presentation(presentationArgs, {
        presentationStatus: PresentationStatus.Skipped,
        finishTime: new Date().getTime()
      });

      // start next presentation
      if (!await goToFirstPendingPresentationInSession(sessionArgs)) {
        // we are done!
        finishPresentationSession(sessionArgs);
      }
      else {
        // reset stream
        const { sessionId } = sessionArgs;
        await startStreamRecording({ streamId: sessionId });
      }
    }
  },

  async finishPresentationSessionStreaming(
    sessionArgs,
    { presentationSessionActivePresentationId },
    { },
    { finishPresentationSession, update_presentation, goToFirstPendingPresentationInSession, startStreamRecording }
  ) {
    const presentationId = presentationSessionActivePresentationId(sessionArgs);
    if (presentationId) {
      const presentationArgs = { presentationId };
      //const presentation = get_presentation(presentationArgs);
      await update_presentation(presentationArgs, {
        presentationStatus: PresentationStatus.Finished,
        finishTime: new Date().getTime()
      });

      // start next presentation
      if (!await goToFirstPendingPresentationInSession(sessionArgs)) {
        // we are done!
        finishPresentationSession(sessionArgs);
      }
      else {
        // reset stream
        const { sessionId } = sessionArgs;
        await startStreamRecording({ streamId: sessionId });
      }
    }
  },

  finishPresentationSession(
    sessionArgs,
    { },
    { },
    { setActivePresentationInSession }
  ) {
    const { sessionId } = sessionArgs;
    setActivePresentationInSession({ sessionId, presentationId: null });
  },

  async goToFirstPendingPresentationInSession(
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
      return await setActivePresentationInSession({ sessionId, presentationId });
    }
    return null;
  },

  async setActivePresentationInSession(
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
        //[presentationFileId.getPath(presentationArgs)]: null
      });
    }

    // TODO: don't set fileId before startStreamRecorder!!!
    // [presentationFileId.getPath(presentationArgs)]: presentationId

    // must make this update separate because that goes to a different DataProvider (MemoryDataProvider),
    // and (for now) update_db is set to the firebase DataProvider
    const streamArgs = { streamId: sessionId };
    const promises = [set_streamFileId(streamArgs, presentationId)];

    const activePresId = presentationSessionActivePresentationId(sessionArgs);
    if (activePresId && activePresId !== presentationId &&
      presentationStatus({ presentationId: activePresId }) === PresentationStatus.InProgress) {
      // set active presentation back to "Pending"
      updates[presentationStatus.getPath({ presentationId: activePresId })] = PresentationStatus.Pending;
    }

    promises.push(update_db(updates));
    return await Promise.all(promises);
  },

  startUploadPresentationSession(
    sessionArgs,
    { orderedPresentations, getPresentationVideoTitle },
    { },
    { videoUploadQueueStart }
  ) {
    const { sessionId } = sessionArgs;
    let presentations = orderedPresentations(sessionArgs);
    presentations = filter(presentations, pres =>
      //!pres.videoId &&
      pres.fileId &&
      pres.presentationStatus === PresentationStatus.Finished
    );

    const fileInfos = map(presentations, ({ fileId, id }) => ({
      fileId,
      title: getPresentationVideoTitle({ presentationId: id })
    }));

    return videoUploadQueueStart({
      queueId: sessionId,
      fileInfos
    });
    //const videoTitle = getPresentationVideoTitle({ presentationId });
  },

  /**
   * Sloppy approach to data validation + migrations for presentations.
   */
  fixPresentationSession(
    sessionArgs,
    { },
    { },
    { fixAllPresentationStatuses }
  ) {
    fixAllPresentationStatuses(sessionArgs);
  },

  async fixAllPresentationStatuses(
    sessionArgs,
    { get_presentations, get_presentationStatus, streamFileExists },
    { },
    { update_db }
  ) {
    const presentations = get_presentations(sessionArgs);

    const updates = {};
    forEach(presentations, (pres, presentationId) => {
      const presentationArgs = { presentationId };
      const {
        fileId,
        videoId,
        presentationStatus
      } = pres;
      if (((fileId && streamFileExists({ fileId })) || videoId) &&
        presentationStatus !== PresentationStatus.Finished) {
        updates[get_presentationStatus.getPath(presentationArgs)] = PresentationStatus.Finished;
      }
    });
    return await update_db(updates);
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
              presentationSessionOperatorUid: 'presentationSessionOperatorUid',
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
/**
 * Some important aspects of working with PresentationSession:
 * 
 * -> Calls startStreamRecording to get started with streaming a new presentation.
 */

import map from 'lodash/map';
import forEach from 'lodash/forEach';
import filter from 'lodash/filter';
import find from 'lodash/find';
import last from 'lodash/last';
import size from 'lodash/size';
import pickBy from 'lodash/pickBy';
import reduce from 'lodash/reduce';
import shuffle from 'lodash/shuffle';
import concat from 'lodash/concat';

import paginationNodes from 'dbdi/paginationNodes';
import { downloadSpreadsheetJSON } from '../../util/SpreadsheetUtil';
import { PresentationStatus } from './PresentationModel';
//import { Promise } from 'firebase';
import { NOT_LOADED } from 'dbdi/util';
import { EmptyObject } from '../../util';

async function doWait(ms) {
  return new Promise((r, j) => setTimeout(r, ms));
}

const sessionReaders = {
  isPresentationSessionInProgress(sessionArgs, { presentationSessionOperatorUid }, { }) {
    return !!presentationSessionOperatorUid(sessionArgs);
  },

  isPresentationSessionOperator(sessionArgs, { presentationSessionOperatorUid }, { currentUid }) {
    return currentUid && presentationSessionOperatorUid(sessionArgs) === currentUid;
  },

  hasPendingPresentations(
    sessionArgs,
    { getFirstPendingPresentationIdInSession }
  ) {
    const id = getFirstPendingPresentationIdInSession(sessionArgs);
    if (id === NOT_LOADED) {
      return NOT_LOADED;
    }
    return !!id;
  },

  getFirstPendingPresentationIdInSession(
    sessionArgs,
    { orderedPresentations, get_presentationStatus }
  ) {
    const presentations = orderedPresentations(sessionArgs);
    const firstPendingPres = find(presentations, p =>
      //p.presentationStatus <= PresentationStatus.InProgress
      get_presentationStatus({ presentationId: p.id }) <= PresentationStatus.InProgress);
    if (firstPendingPres) {
      return firstPendingPres.id;
    }
    return null;
  },

  getSecondPendingPresentationIdInSession(
    sessionArgs,
    { orderedPresentations }
  ) {
    const ignoreCount = 1;

    const presentations = orderedPresentations(sessionArgs);
    let found = 0;
    const firstPendingPres = find(presentations, p => {
      //p.presentationStatus <= PresentationStatus.InProgress
      //console.warn('found:', p.title, p.presentationStatus, found >= ignoreCount);
      if (p.presentationStatus <= PresentationStatus.InProgress) {
        if (found >= ignoreCount) {
          return true;
        }
        else {
          ++found;
        }
      }
      return false;
    });
    if (firstPendingPres) {
      return firstPendingPres.id;
    }
    return null;
  },

  getPresentationIdsByStatusInSession(
    { sessionId, presentationStatus },
    { get_presentations }
  ) {
    let presentations = get_presentations({ sessionId }) || EmptyObject;
    presentations = pickBy(presentations, pres => pres.presentationStatus === presentationStatus);
    return Object.keys(presentations);
  },

  getPresentationSessionDeletableFileCount(
    sessionArgs,
    { getPresentationSessionDeletableFileList }
  ) {
    return size(getPresentationSessionDeletableFileList(sessionArgs));
  },

  getPresentationSessionDeletableFileSize(
    sessionArgs,
    { getPresentationSessionDeletableFileList, streamFileSize }
  ) {
    return reduce(getPresentationSessionDeletableFileList(sessionArgs), (prev, presentation) =>
      prev + (streamFileSize({ fileId: presentation.fileId }) || 0)
      , 0);
  },

  getPresentationSessionDeletableFileList(
    sessionArgs,
    { orderedPresentations, streamFileExists }
  ) {
    // TODO: keep it ordered because it adds the id to each presentation?!
    let presentations = orderedPresentations(sessionArgs);
    //console.warn(sessionArgs.sessionId, presentations);

    let presentationsReady = map(presentations, pres => (
      pres.videoId &&
      pres.fileId &&
      streamFileExists({ fileId: pres.fileId })) ||
      false
    );

    // TODO handle streamFileExists(...) === NOT_LOADED

    return filter(presentations, (pres, i) => presentationsReady[i]);
  },

  getUploadReadyPresentationCount(
    sessionArgs,
    { getUploadReadyPresentationList }
  ) {
    return size(getUploadReadyPresentationList(sessionArgs));
  },

  getUploadReadyPresentationList(
    sessionArgs,
    { orderedPresentations, streamFileExists }
  ) {
    // TODO: keep it ordered because it adds the id to each presentation?!
    let presentations = orderedPresentations(sessionArgs);

    // TODO: fix orderedPresentations

    let presentationsReady = map(presentations, pres => (
      !pres.videoId &&
      pres.fileId &&
      pres.presentationStatus === PresentationStatus.Finished &&
      streamFileExists({ fileId: pres.fileId })) ||
      false
    );

    // TODO handle streamFileExists(...) === NOT_LOADED

    return filter(presentations, (pres, i) => presentationsReady[i]);
  }
};

const sessionWriters = {
  /**
   * Import presentations from Google spreadsheet
   */
  async importPresentationsToSession(
    { sessionId, publishId, gid },
    { getFirstPendingPresentationIdInSession },
    { currentUid },
    { push_presentation, set_presentationStatus }
  ) {
    const csvOptions = {
      columnArr: {
        start: 1,
        end: 5,
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

    await Promise.all(promises);

    const firstId = await getFirstPendingPresentationIdInSession({ sessionId });
    if (firstId) {
      set_presentationStatus({ presentationId: firstId }, PresentationStatus.GettingReady);
    }

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

  async addNewPresentation(
    sessionArgs,
    { orderedPresentations },
    { currentUid },
    { push_presentation,
      fixPresentationSessionOrder }
  ) {
    const presentations = orderedPresentations(sessionArgs);
    // let lastPres = findLast(presentations, p =>
    //   p.presentationStatus === PresentationStatus.Pending ||
    //   p.presentationStatus === PresentationStatus.GettingReady ||
    //   p.presentationStatus === PresentationStatus.InProgress
    // );
    const lastPres = lastPres || last(presentations);
    const index = lastPres && lastPres.index + 0.00001 || 0;

    const { sessionId } = sessionArgs;
    const newPres = {
      sessionId,
      index,
      creatorUid: currentUid,
      presentationStatus: PresentationStatus.Pending
    };

    await push_presentation(newPres);
    await fixPresentationSessionOrder(sessionArgs);
  },

  // NOTE: This only sets the presentation, does not actually start recording
  async startPresentationSessionStreaming(
    sessionArgs,
    { get_presentationSessionOperatorUid },
    { currentUid },
    { set_presentationSessionOperatorUid, goToFirstPendingPresentationInSession, startStreamRecording }
  ) {
    if (get_presentationSessionOperatorUid(sessionArgs) !== currentUid) {
      await set_presentationSessionOperatorUid(sessionArgs, currentUid);
    }
    const res = await goToFirstPendingPresentationInSession(sessionArgs);
    if (res) {
      return await startStreamRecording({ streamId: sessionArgs.sessionId });
    }
  },

  /**
   * Do the actual recording.
   * For each presentation, operator goes: Start -> (Pause/Resume ->) Finish
   */
  async startPresentationSessionStreamRecording(
    { streamArgs, presentationId },
    { },
    { },
    { set_streamFileId, set_presentationFileId, set_presentationStatus }
  ) {
    return Promise.all([
      set_streamFileId(streamArgs, presentationId),
      set_presentationFileId({ presentationId }, presentationId),
      set_presentationStatus({ presentationId }, PresentationStatus.InProgress)
    ]);
  },

  async stopOperatingPresentationSession(
    { sessionId },
    { presentationSessionOperatorUid },
    { currentUid },
    { set_presentationSessionOperatorUid,
      setActivePresentationInSession }
  ) {
    await setActivePresentationInSession({ sessionId, presentationId: null });
    if (currentUid && currentUid === presentationSessionOperatorUid({ sessionId })) {
      return set_presentationSessionOperatorUid({ sessionId }, null);
    }
  },

  async _updateActivePresentationInSession(
    { sessionId, newStatus },
    { presentationSessionActivePresentationId, hasSelectedInputMedia, get_presentationStatus },
    { },
    { finishPresentationSession, update_presentation,
      goToFirstPendingPresentationInSession,
      startStreamRecording }
  ) {
    const sessionArgs = { sessionId };
    const presentationId = presentationSessionActivePresentationId(sessionArgs);
    if (presentationId) {
      const presentationArgs = { presentationId };
      //const presentation = get_presentation(presentationArgs);
      await update_presentation(presentationArgs, {
        presentationStatus: newStatus,
        finishTime: new Date().getTime()
      });

      if (get_presentationStatus(presentationArgs) !== newStatus) {
        // there was a bug here... keep a few extra safety checks for now
        console.warn('Status was not updated: ' + get_presentationStatus(presentationArgs));
        await doWait(800);
        if (get_presentationStatus(presentationArgs) !== newStatus) {
          console.warn('Status was not updated(2): ' + get_presentationStatus(presentationArgs));
        }
      }

      // start next presentation
      if (!await goToFirstPendingPresentationInSession(sessionArgs)) {
        // we are done!
        return await finishPresentationSession(sessionArgs);
      }
      else {
        // reset stream
        const { sessionId } = sessionArgs;
        //console.warn(hasSelectedInputMedia());
        if (hasSelectedInputMedia()) {
          await startStreamRecording({ streamId: sessionId });
          return true;
        }
        return false;
      }
    }
  },

  async skipPresentationInSession(
    sessionArgs,
    { },
    { },
    { _updateActivePresentationInSession }
  ) {
    const { sessionId } = sessionArgs;
    return _updateActivePresentationInSession({ sessionId, newStatus: PresentationStatus.Skipped });
  },

  async finishPresentationSessionStreaming(
    sessionArgs,
    { },
    { },
    { _updateActivePresentationInSession }
  ) {
    //console.warn('finishPresentationSessionStreaming');
    const { sessionId } = sessionArgs;
    return _updateActivePresentationInSession({ sessionId, newStatus: PresentationStatus.Finished });
  },

  async movePresentationUpNext(
    { presentationId },
    { get_presentation, getFirstPendingPresentationIdInSession },
    { },
    { set_presentationIndex, fixPresentationSessionOrder }
  ) {
    const presentationArgs = { presentationId };
    const presentation = get_presentation(presentationArgs);

    const { sessionId } = presentation;
    const sessionArgs = { sessionId };

    // get first presentation
    const firstId = getFirstPendingPresentationIdInSession(sessionArgs);
    if (firstId && firstId !== presentationId) {
      const firstPres = get_presentation({ presentationId: firstId });
      const firstStatus = firstPres.presentationStatus;
      const firstIndex = firstPres.index;
      let delta = -0.0001; // before first
      if (firstStatus > PresentationStatus.Pending) {
        delta *= -1; // after first
      }
      await set_presentationIndex(presentationArgs, firstIndex + delta);
      return await fixPresentationSessionOrder(sessionArgs);
    }
  },

  async startPresentationInSession(
    presentationArgs,
    { get_presentation },
    { },
    { setActivePresentationInSession, movePresentationUpNext }
  ) {
    const presentation = get_presentation(presentationArgs);
    console.assert(presentation);

    const { sessionId } = presentation;

    // set as active
    // console.warn({...presentationArgs});
    await setActivePresentationInSession({ sessionId, ...presentationArgs });

    // make sure, it's at the right index!
    await movePresentationUpNext(presentationArgs);


    // set runner up
    return true;
  },

  async fixPresentationSessionOrder(
    sessionArgs,
    { orderedPresentations, get_presentations },
    { },
    { set_presentationIndex, setGettingReadyPresentationInSession, update_db }
  ) {
    const presentations = orderedPresentations(sessionArgs);
    console.assert(presentations);

    const updates = {};
    forEach(presentations, ({ id }, i) => {
      updates[set_presentationIndex.getPath({ presentationId: id })] = i;
    });

    const res = await update_db(updates);

    setGettingReadyPresentationInSession(sessionArgs);

    get_presentations.notifyPathChanged(sessionArgs);

    return res;
  },

  async shufflePresentationSessionOrder(
    sessionArgs,
    { nonPendingPresentations, pendingPresentations, get_presentations },
    { },
    { set_presentationIndex, setGettingReadyPresentationInSession, update_db }
  ) {
    const presentations1 = nonPendingPresentations(sessionArgs);
    const presentations2 = pendingPresentations(sessionArgs);

    const presentations = concat(
      presentations1,
      shuffle(presentations2),
    );

    const updates = {};
    forEach(presentations, ({ id }, i) => {
      updates[set_presentationIndex.getPath({ presentationId: id })] = i;
    });

    const res = await update_db(updates);

    setGettingReadyPresentationInSession(sessionArgs);

    get_presentations.notifyPathChanged(sessionArgs);

    return res;
  },

  /**
   * Returns presentationId if successful
   */
  async goToFirstPendingPresentationInSession(
    { sessionId },
    { getFirstPendingPresentationIdInSession },
    { },
    { setActivePresentationInSession }
  ) {
    const presentationId = getFirstPendingPresentationIdInSession({ sessionId });
    if (presentationId) {
      await setActivePresentationInSession({ sessionId, presentationId });
      return presentationId;
    }
    return null;
  },

  async setGettingReadyPresentationInSession(
    sessionArgs,
    { getPresentationIdsByStatusInSession,
      get_presentationStatus,
      getSecondPendingPresentationIdInSession,
      presentationSessionActivePresentationId },
    { },
    { update_db }
  ) {
    // reset status of presentations currently in "GettingReady" status
    const { sessionId } = sessionArgs;
    const previousIds = getPresentationIdsByStatusInSession({
      sessionId,
      presentationStatus: PresentationStatus.GettingReady
    });
    const upd = {};
    forEach(previousIds, presentationId =>
      upd[get_presentationStatus.getPath({ presentationId })] = PresentationStatus.Pending
    );

    // set next pres to "GettingReady"
    const activePresId = presentationSessionActivePresentationId(sessionArgs);
    if (activePresId) {
      let presentationId = getSecondPendingPresentationIdInSession(sessionArgs);
      if (presentationId) {
        upd[get_presentationStatus.getPath({ presentationId })] = PresentationStatus.GettingReady;
      }
    }

    return update_db(upd);
  },

  // The core of the rolling session: setting the currently active presentation
  async setActivePresentationInSession(
    { sessionId, presentationId },
    { get_presentation, presentationStatus,
      presentationSessionActivePresentationId },
    { },
    { update_db, setGettingReadyPresentationInSession }
  ) {
    const sessionArgs = { sessionId };

    const updates = {
      [presentationSessionActivePresentationId.getPath(sessionArgs)]: presentationId
    };
    if (presentationId) {
      // set new active presentation
      const presentationArgs = { presentationId };
      Object.assign(updates, {
        [presentationStatus.getPath(presentationArgs)]: PresentationStatus.OnStage
      });
    }

    // must make this update separate because that goes to a different DataProvider (MemoryDataProvider),
    // and (for now) update_db is set to the firebase DataProvider
    const promises = [];

    const activePresId = presentationSessionActivePresentationId(sessionArgs);
    const activePresStatus = activePresId && presentationStatus({ presentationId: activePresId });
    if (activePresId &&
      activePresId !== presentationId &&
      //activePresId !== getSecondPendingPresentationIdInSession(sessionArgs) &&
      (activePresStatus === PresentationStatus.InProgress || activePresStatus === PresentationStatus.OnStage)) {
      // update status of previously active presentation
      const pres = get_presentation({ presentationId: activePresId });
      if (!pres.videoId) {
        // set active presentation back to "Pending"
        updates[presentationStatus.getPath({ presentationId: activePresId })] = PresentationStatus.Pending;
      }
      else {
        // already has a video, so set status back to "Finished"
        updates[presentationStatus.getPath({ presentationId: activePresId })] = PresentationStatus.Finished;
      }
    }

    promises.push(update_db(updates));
    const res = Promise.all(promises);
    res.then(() => {
      // set GettingReady state
      promises.push(setGettingReadyPresentationInSession({ sessionId }));
    });
    return await res;
  },

  /**
   * start upload all presentations in session via VideoUploadQueue
   */
  async startUploadPresentationSession(
    sessionArgs,
    { getUploadReadyPresentationList, getPresentationVideoTitle },
    { },
    { videoUploadQueueStart, set_presentationVideoId }
  ) {
    // get presentations
    const presentations = await getUploadReadyPresentationList(sessionArgs);

    // prepare array of data representing what should be sent to the remote (e.g. YouTube) API
    const fileInfos = map(presentations, ({ fileId, id }) => ({
      fileId,
      title: getPresentationVideoTitle({ presentationId: id })
    }));

    // once video is uploaded set videoId
    // (todo: consider also setting channelId, providerId etc...)
    function onVideoUploaded(fileId, videoId) {
      const presOfFile = find(presentations, pres => pres.fileId === fileId);
      if (!presOfFile) {
        console.warn(`Could not find presentation with fileId '${fileId}' after upload → could not set videoId`);
      }
      else {
        const presentationArgs = { presentationId: presOfFile.id };
        set_presentationVideoId(presentationArgs, videoId);
      }
    }

    const { sessionId } = sessionArgs;
    return videoUploadQueueStart({
      queueId: sessionId,
      fileInfos,
      onVideoUploaded
    });
    //const videoTitle = getPresentationVideoTitle({ presentationId });
  },

  /**
   * (sloppy approach to) data validation + migrations for presentations.
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
    { get_presentations, get_presentationStatus, get_presentationSessionId, streamFileExists },
    { },
    { update_db }
  ) {
    // const presentations = get_presentations(sessionArgs);

    // // for each presentation: set status to finished, if fileId + videoId are present?
    // const updates = {};
    // forEach(presentations, (pres, presentationId) => {
    //   const presentationArgs = { presentationId };
    //   const {
    //     fileId,
    //     videoId,
    //     presentationStatus
    //   } = pres;

    //   if (((fileId && streamFileExists({ fileId })) || videoId) &&
    //     presentationStatus !== PresentationStatus.Finished) {
    //     updates[get_presentationStatus.getPath(presentationArgs)] = PresentationStatus.Finished;
    //   }
    // });
    // return await update_db(updates);
  },

  async finishPresentationSession(
    sessionArgs,
    { },
    { },
    { stopOperatingPresentationSession,
      shutdownStream }
  ) {
    const { sessionId } = sessionArgs;
    await stopOperatingPresentationSession(sessionArgs);
    const streamArgs = { streamId: sessionId };
    await shutdownStream(streamArgs);
  },

  async deleteAllVideoIdsInSession(
    sessionArgs,
    { get_presentations, get_presentationVideoId },
    { },
    { update_db }
  ) {
    const presentations = get_presentations(sessionArgs);

    const updates = {};
    debugger;
    forEach(presentations, (pres, presentationId) => {
      const presentationArgs = { presentationId };
      const {
        videoId
      } = pres;

      if (videoId) {
        updates[get_presentationVideoId.getPath(presentationArgs)] = null;
      }
    });
    return await update_db(updates);
  },

  async deletePresentationSession(
    sessionArgs,
    { get_presentation, get_presentations,
      get_presentationSession,
      get_livePresentationSessionId },
    { },
    { update_db }
  ) {
    const { sessionId } = sessionArgs;

    const sess = await get_presentationSession.readAsync(sessionArgs);
    const presentations = await get_presentations.readAsync(sessionArgs);
    const liveSessionId = await get_livePresentationSessionId.readAsync();
    // if (sess === NOT_LOADED |
    //   presentations === NOT_LOADED |
    //   liveSessionId === NOT_LOADED) {
    //   return NOT_LOADED;
    // }

    if (!sess) {
      throw new Error('invalid sessionId for deletion', sessionId);
    }

    const updates = {};

    // delete session
    updates[get_presentationSession.getPath(sessionArgs)] = null;

    if (liveSessionId === sessionId) {
      // delete live sessionId
      updates[get_livePresentationSessionId.getPath()] = null;
    }

    // delete all presentations of sessions
    forEach(presentations, (pres, presentationId) => {
      updates[get_presentation.getPath({ presentationId })] = null;
    });

    return await update_db(updates);
  },

  async deletePresentationSessionFiles(
    sessionArgs,
    { getPresentationSessionDeletableFileList },
    { },
    { streamFileDelete, set_presentationFileId }
  ) {
    const pres = getPresentationSessionDeletableFileList(sessionArgs);
    const promises = map(pres, async (p) => {
      const {
        fileId,
        id: presentationId
      } = p;

      !fileId && console.error('fileId not set in presentation', p);
      try {
        await streamFileDelete({ fileId });

        console.assert(presentationId);
        set_presentationFileId({ presentationId }, null);
      }
      catch (err) {
        console.error(`Could not delete presentation file ${p.title} (${presentationId}): ` +
          err.stack);
      }
    });

    return Promise.all(promises);
  },

  async copyPresentationSession(
    sessionArgs,
    { get_presentationSession, get_presentations },
    { currentUid },
    { newPresentationSession, push_presentation }
  ) {
    const newSessionId = await newPresentationSession();

    const [sess, presis] = await Promise.all([
      get_presentationSession.readAsync({ sessionId: newSessionId }),
      get_presentations.readAsync(sessionArgs)
    ]);

    const promises = map(presis, oldPres => {
      const pres = {};
      pres.sessionId = newSessionId;
      pres.index = oldPres.index;
      pres.presentationStatus = PresentationStatus.Pending;
      pres.creatorUid = currentUid;
      if (oldPres.userNames) {
        pres.userNames = oldPres.userNames;
      }
      if (oldPres.title) {
        pres.title = oldPres.title;
      }
      if (oldPres.userNamesString) {
        pres.userNamesString = oldPres.userNamesString;
      }

      return push_presentation(pres);
    });

    await Promise.all(promises);

    return newSessionId;
  }
};

export default {
  presentationSessionData: {
    path: 'presentationSessions',

    readers: {
    },

    writers: {
      async newPresentationSession(
        { },
        { },
        { },
        { push_presentationSession,
          set_livePresentationSessionId }
      ) {
        // create new session
        const newSess = {};
        const sessionId = push_presentationSession(newSess).key;

        // create new set of presentations

        // set live id
        await set_livePresentationSessionId(sessionId);
        console.warn('new session', sessionId);
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
      },

      presenterPreferences: {
        path: 'presenterPreferences',
        dataProvider: 'memory',
        children: {
          isPresentEditMode: 'isPresentEditMode'
        }
      }
    }
  }
};
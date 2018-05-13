import gapi from 'resources/gapi.js';
import {
  GapiStatus,
  gapiInit,
  gapiAuth
} from './YouTubeAPI';

import YtUploadModel from './YtUploadModel';
import YtUploadQueueModel from './YtUploadQueueModel';
import YtResourceModel from './YtResourceModel';

import { NOT_LOADED } from 'src/dbdi/react';
import { getOptionalArgument } from 'src/dbdi/dataAccessUtil';

export default {
  ytApi: {
    path: 'ytApi',

    readers: {
      gapiIsAuthenticated(
        { }, { },
        { gapiStatus },
      ) {
        return gapiStatus === GapiStatus.Authorized;
      },
      gapiAuthObject(
        { }, { },
        { gapiStatus },
        { gapiEnsureInitialized }
      ) {
        if (gapiStatus === NOT_LOADED) {
          gapiEnsureInitialized();
          return NOT_LOADED;
        }
        const auth = gapi.auth2.getAuthInstance();
        // auth.isSignedIn.listen(isAuthorized =>
        //   set_gapiStatus(isAuthorized ? GapiStatus.Authorized : GapiStatus.Initialized)
        // );
        return auth;
      }
    },

    writers: {
      resetGapiStatus(
        { }, { },
        { gapiStatus },
        { set_gapiStatus, set_gapiTokens, set_gapiError }
      ) {
        if (gapiStatus > GapiStatus.Initialized) {
          set_gapiTokens(null);
          set_gapiError(null);
          set_gapiStatus(GapiStatus.Initialized);
        }
        return true;
      },

      async gapiDisconnect(
        { },
        { },
        { gapiTokens },
        { resetGapiStatus, gapiHardAuth }
      ) {
        if (gapi.auth2) {
          gapi.auth && gapi.auth.setToken(null);
          try {
            Promise.all([
              gapi.auth2.getAuthInstance().signOut(),
              gapi.auth2.getAuthInstance().disconnect()
            ]);
          }
          catch (err) {
            console.error(err);
          }
        }
        
        if (gapiTokens && gapiTokens.access_token) {
          try {
            await window.fetch('https://accounts.google.com/o/oauth2/revoke?token=' + gapiTokens.access_token);
          }
          catch (err) {
            console.warn('fetch error (ignore if this is only complaining about missing `Access-Control-Allow-Origin` header)', err);
          }
        }
        resetGapiStatus();
        gapiHardAuth();
        //}
      },

      async gapiEnsureInitialized(
        { }, { },
        { gapiStatus },
        { set_gapiStatus, set_gapiError }
      ) {
        if (!gapiStatus || gapiStatus < GapiStatus.Initializing) {
          set_gapiStatus(GapiStatus.Initializing);
          try {
            await gapiInit();
            if (gapiStatus < GapiStatus.Initialized) {
              return set_gapiStatus(GapiStatus.Initialized);
            }
          }
          catch (err) {
            console.error('gapi init failed -', err);
            set_gapiError(err);
            set_gapiStatus(GapiStatus.None);
          }
        }
      },

      async _gapiDoAuth(
        args, { },
        { gapiStatus },
        { set_gapiStatus, set_gapiTokens, set_gapiError }
      ) {
        // see https://developers.google.com/api-client-library/javascript/reference/referencedocs#gapiauth2authresponse
        if (gapiStatus === GapiStatus.Authorizing || gapiStatus < GapiStatus.Initialized) {
          // make sure we don't try to authorize repeatedly (by accident)
          return false;
        }

        const { soft } = args;

        set_gapiStatus(GapiStatus.Authorizing);
        try {
          const prompt = getOptionalArgument(args, 'prompt', undefined);
          const result = await gapiAuth(soft, prompt);
          console.info('gapi auth successful', result);
          set_gapiTokens(result);
          set_gapiStatus(GapiStatus.Authorized);
          return true;
        }
        catch (err) {
          set_gapiStatus(GapiStatus.Initialized); // reset status
          switch (err.error) {
            case 'popup_blocked_by_browser':
              set_gapiStatus(GapiStatus.PopupBlocked);
              //console.error(err);
              break;
            case 'immediate_failed':
              // do nothing
              break;
            default:
              set_gapiError(err);
              break;
          }
          console.error('gapi auth failed -', err.error, err);
          return false;
        }
      },

      /**
       * Tries to 
       */
      async gapiSoftAuth(
        { }, { },
        { gapiStatus, isGapiTokenFresh },
        { gapiEnsureInitialized, _gapiDoAuth, set_gapiStatus }
      ) {
        if (gapiStatus === GapiStatus.Initializing || gapiStatus === GapiStatus.Authorizing) {
          // TODO: implement proper queueing behavior
          return false;
        }
        if (gapiStatus < GapiStatus.Authorized || !isGapiTokenFresh) {
          await gapiEnsureInitialized();

          const isAuthed = await _gapiDoAuth({ soft: true });
          if (!isAuthed) {
            set_gapiStatus(GapiStatus.NeedUserConsent);
            return false;
          }
        }
        return true;
      },

      async gapiHardAuth(
        args, { },
        { gapiStatus },
        { gapiSoftAuth, _gapiDoAuth }
      ) {
        if (gapiStatus === GapiStatus.Initializing || gapiStatus === GapiStatus.Authorizing) {
          // TODO: implement proper queueing behavior
          return false;
        }

        const prompt = getOptionalArgument(args, 'prompt', null);
        let isAuthed;
        if (prompt) {
          isAuthed = await _gapiDoAuth({ soft: false, prompt });
        }
        else {
          isAuthed = await gapiSoftAuth();
          if (!isAuthed) {
            console.warn('YT immediate auth failed - requesting user consent');

            // could not authorize immediately -> show user consent screen
            isAuthed = await _gapiDoAuth({ soft: false });
          }
        }
        return isAuthed;
      }
    },

    children: {
      gapiStatus: {
        path: 'status',
        reader(val) {
          return val || GapiStatus.None;
        }
      },
      gapiError: {
        path: 'error'
      },
      gapiTokens: {
        path: 'gapiTokens',
        readers: {
          isGapiTokenFresh(
            { },
            { },
            { gapiTokens }
          ) {
            if (!gapiTokens) return false;

            // time in seconds since 1970
            const expiresAt = gapiTokens.expires_at;

            // get remaining minutes
            const minutesLeft = (parseInt(expiresAt) - new Date().getTime() / 1000) / 60;

            // not fresh, if less than two minutes left
            return minutesLeft > 2;
          }
        }
      }
    }
  },
  ...YtUploadModel,
  ...YtUploadQueueModel,
  ...YtResourceModel
};
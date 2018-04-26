import gapi from 'resources/gapi.js';
import {
  GapiStatus,
  gapiInit,
  gapiAuth,

  sendYtRequest
} from './youtube/YouTubeAPI';
import { NOT_LOADED } from '../../dbdi/react';

export default {
  youtubeAPI: {
    path: 'ytApi',

    readers: {
      gapiAuthObject(
        { }, { },
        { gapiStatus },
        { gapiEnsureInitialized, set_gapiStatus }
      ) {
        if (gapiStatus === NOT_LOADED) {
          gapiEnsureInitialized();
          return NOT_LOADED;
        }
        const auth = gapi.auth2.getAuthInstance();
        auth.isSignedIn.listen(isAuthorized =>
          set_gapiStatus(isAuthorized ? GapiStatus.Authorized : GapiStatus.Initialized)
        );
        return auth;
      }
    },

    writers: {
      async resetGapiStatus(
        { }, { },
        { gapiStatus }, { set_gapiStatus }
      ) {
        if (gapiStatus > GapiStatus.Initialized) {
          return set_gapiStatus(GapiStatus.Initialized);
        }
      },

      async gapiEnsureInitialized(
        { }, { },
        { gapiStatus },
        { set_gapiStatus }
      ) {
        if (!gapiStatus || gapiStatus < GapiStatus.Initialized) {
          await gapiInit();
          if (gapiStatus < GapiStatus.Initialized) {
            return set_gapiStatus(GapiStatus.Initialized);
          }
        }
      },
      async gapiEnsureAuthorized(
        { }, { },
        { gapiStatus, isGapiTokenFresh },
        { gapiEnsureInitialized, set_gapiStatus, set_gapiTokens }
      ) {
        // authorize if not authorized previously, or if token is (almost) expired
        if (!gapiStatus || gapiStatus < GapiStatus.Authorized || !isGapiTokenFresh) {
          await gapiEnsureInitialized();

          // see https://developers.google.com/api-client-library/javascript/reference/referencedocs#gapiauth2authresponse
          let result;
          try {
            result = await gapiAuth(true);
          }
          catch (err) {
            console.warn('YT immediate auth failed - requesting user consent', err);

            // could not authorize immediately -> show user consent screen
            try {
              result = await gapiAuth(false);
            }
            catch (err) {
              if (err.error === 'popup_blocked_by_browser') {
                set_gapiStatus(GapiStatus.PopupBlocked);
                console.error(err);
                throw new Error(err.error);
              }
            }
          }
          // const accessToken = result.access_token;
          // const idToken = result.id_token;
          //gapi.client.setToken({ access_token: accessToken });
          set_gapiTokens(result);
          return set_gapiStatus(GapiStatus.Authorized);
        }
      },

      async ytUploadVideo({ }, { }, { }, { gapiEnsureAuthorized }) {
        await gapiEnsureAuthorized();
        // TODO: how to upload a video file while it is still being written to?
      }
    },

    children: {
      gapiStatus: 'status',
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
            const minutesLeft = (parseInt(expiresAt) - new Date().getTime()/1000)/60;

            // not fresh, if less than two minutes left
            return minutesLeft > 2;
          }
        }
      },

      ytSignInStatus: {
        path: 'signInStatus'
      },

      ytMyChannels: {
        path: 'myChannels',
        async fetch(
          { },
          { },
          { },
          { gapiEnsureAuthorized }
        ) {
          await gapiEnsureAuthorized();
          const response = await sendYtRequest('channelList', {
            mine: true,
            part: 'snippet,statistics,contentDetails'
          });
          return response.result;
        },
        children: {
          ytMyChannel: {
            path: 'items[0]',
            children: {
              ytMyChannelSnippet: {
                path: 'snippet'
              }
            }
          }
        }
      },

      ytChannels: {
        path: 'channels',
        children: {
          ytChannel: {
            path: '$(channelId)',
            async fetch({ channelId }) {
              // TODO
            }
          }
        }
      },

      ytPlaylists: {
        path: 'playlists',
        children: {
          ytPlaylist: {
            path: '$(playlistId)',
            async fetch({ playlistId }) {
              // TODO
            }
          }
        }
      },

      ytVideos: {
        path: 'videos',
        children: {
          ytVideo: {
            path: '$(videoId)',
            async fetch({ videoId }) {
              // TODO
            }
          }
        }
      }
    }
  }
};
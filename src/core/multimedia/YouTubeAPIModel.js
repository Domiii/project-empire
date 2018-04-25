import gapi from 'resources/gapi.js';
import {
  GapiStatus,
  gapiInit,
  gapiAuth
} from './youtube/YouTubeAPI';
import { NOT_LOADED } from '../../dbdi/react';

export default {
  youtubeAPI: {
    path: 'ytApi',

    readers: {
      gapiAuthObject({ }, { }, { gapiStatus }, { gapiEnsureInitialized }) {
        if (gapiStatus === NOT_LOADED) {
          gapiEnsureInitialized();
          return NOT_LOADED;
        }
        return gapi.auth2.getAuthInstance();
      }
    },

    writers: {
      async gapiEnsureInitialized({ }, { }, { gapiStatus }, { set_gapiStatus }) {
        if (!gapiStatus || gapiStatus < GapiStatus.Initialized) {
          await gapiInit();
          gapi.auth2.getAuthInstance().isSignedIn.listen(isAuthorized =>
            set_gapiStatus(GapiStatus.Initialized)
          );
        }
      },
      async gapiEnsureAuthorized(
        { }, { },
        { gapiStatus },
        { gapiEnsureInitialized, set_gapiStatus, set_gapiTokens }
      ) {
        if (!gapiStatus || gapiStatus < GapiStatus.Authorized) {
          await gapiEnsureInitialized();

          // see https://developers.google.com/api-client-library/javascript/reference/referencedocs#gapiauth2authresponse
          let result;
          try {
            result = await gapiAuth(true);
          } 
          catch (err) {
            // could not authorize immediately -> show user login screen
            result = await gapiAuth(false);
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
      gapiTokens: 'gapiTokens',

      ytSignInStatus: {
        path: 'signInStatus'
      },

      ytMyChannels: {
        path: 'myChannels',
        async fetch() {
          const response = await gapi.client.youtube.channels.list({
            mine: true,
            part: 'snippet,statistics,contentDetails'
          });
          return response.result;
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
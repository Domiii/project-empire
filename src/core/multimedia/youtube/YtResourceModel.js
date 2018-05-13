import {
  sendYtRequest
} from './YouTubeAPI';
import { NOT_LOADED } from '../../../dbdi/react';

/**
 * Provide an interface to access/query any YouTube resources
 */

export default {
  ytUrls: {
    path: 'urls',
    readers: {
      ytVideoEditUrl({ videoId }) {
        return `https://www.youtube.com/edit?video_id=${videoId}`;
      }
    }
  },

  ytMyChannels: {
    path: 'myChannels',
    async fetch(
      { },
      { },
      { },
      { gapiHardAuth, set_gapiError, gapiDisconnect }
    ) {
      const isAuthed = await gapiHardAuth();
      if (isAuthed) {
        try {
          const response = await sendYtRequest('channelList', {
            mine: true,
            part: 'id,snippet,contentDetails' // ,statistics
          });
          return response.result;
        }
        catch (_err) {
          // handle weird errors by the YT Api
          let err = _err;
          if (err && err.result) {
            err = err.result;
          }
          if (err && err.error) {
            err = err.error;
            if (err.errors) {
              err = err.errors[0];
            }
          }
          set_gapiError(err);
          //throw err;
          return null;
        }
      }
      return null;
    },
    children: {
      ytMyChannel: {
        path: 'items[0]',
        children: {
          ytMyChannelId: {
            path: 'id'
          },
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
};
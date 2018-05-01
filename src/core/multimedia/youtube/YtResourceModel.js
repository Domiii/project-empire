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
      { gapiHardAuth, set_gapiError }
    ) {
      const isAuthed = await gapiHardAuth();
      if (isAuthed) {
        try {
          const response = await sendYtRequest('channelList', {
            mine: true,
            part: 'snippet,statistics,contentDetails'
          });
          return response.result;
        }
        catch (err) {
          set_gapiError(err);
          throw err;
        }
      }
      return NOT_LOADED;
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
};
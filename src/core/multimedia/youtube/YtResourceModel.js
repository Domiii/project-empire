import {
  sendYtRequest
} from './YouTubeAPI';

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
      { gapiHardAuth }
    ) {
      await gapiHardAuth();
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
};
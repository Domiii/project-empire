import paginationNodes from 'src/dbdi/nodes/paginationNodes';

export default {
  ...paginationNodes('presentationSessionsOfPage', 'sortedPresentationSessionsIdsOfPage'),

  presentationSessions: {
    path: 'presentationSessions',

    children: {
      // The session that is currently in progress
      currentSessionId: 'currentSessionId',

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
};
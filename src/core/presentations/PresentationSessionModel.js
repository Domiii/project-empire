import paginationNodes from 'src/dbdi/nodes/paginationNodes';

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
        const sessionId = push_presentationSession({}).key;
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

            children: {
              finishTime: 'finishTime',
              playlistId: 'playlistId'
            }
          }
        }
      }
    }
  }
};
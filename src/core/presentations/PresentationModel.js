
export const PresentationStatus = {
  Pending: 1,
  InProgress: 2,
  Finished: 3,
  Cancelled: 4
};

export default {
  presentationData: {
    path: 'presentations',
    children: {
      presentations: {
        path: 'list',
        children: {
          presentation: {
            path: '$(presentationId)',

            hasMany: [
              'user',
              'project'
            ],

            onWrite: [
              'createdAt',
              'updatedAt'
            ],

            children: {
              presentationStatus: 'presentationStatus',
              sessionId: 'sessionId', // the session this presentation belongs to
              creatorUid: 'creatorUid', // the user who started this presentation
              fileId: 'fileId', // local filesystem fileId (file only available to creator on the device + browser they used to record it with)
              videoId: 'videoId', // youtube videoId (once uploaded)

              title: 'title',
              commentText: 'commentText'
            }
          }
        }
      }
    }
  }
};
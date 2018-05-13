

export const YoutubeUploadQueueStatus = {
  None: 0,
  Running: 1,
  Paused: 2,
  Finished: 3
};

export default {
  videoUploadQueues: {
    path: 'videoUploadQueues',
    children: {
      videoUploadQueue: {
        path: '$(queueId)',

        writers: {
          async videoUploadQueueStart(
            { queueId, fileInfos },
            { },
            { },
            { ytStartVideoUpload }
          ) {

            // TODO: proper event model?
            // start....
            // uploader.onUploadComplete -> start next

          }
        },

        children: {
          // ytVideoUploadStatus: {
          //   path: '$(fileId)',

          //   children: {

          //   }
          // }

          // the queue controller object
          //videoUploadQueueObject: 'queueObject',
        }
      }
    }
  }
};
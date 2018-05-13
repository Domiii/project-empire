

export const YoutubeUploadQueueStatus = {
  None: 0,
  Running: 1,
  Paused: 2,
  Finished: 3
};

export default {
  ytVideoUploadQueues: {
    path: 'videoUploadQueues',
    writers: {
      async ytBatchUploadVideos(
        { videos },
        { },
        { },
        { ytStartVideoUpload }
      ) {

        // start....
        // uploader.onUploadComplete -> start next
      }
    },
    children: {
      ytVideoUploadQueue: {
        path: '$(queueId)',

        children: {
          videoUploadQueueObject: 'queueObject',

        }
      }
    }
  }
};
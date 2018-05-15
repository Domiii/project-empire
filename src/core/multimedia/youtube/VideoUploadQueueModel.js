import { getOptionalArgument } from "../../../dbdi/dataAccessUtil";
import { EmptyObject } from "../../../util";


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

        readers: {
          isVideoUploadQueueRunning(
            queueArgs,
            { videoUploadQueueFileInfos, videoUploadQueueLastIndex }
          ) {
            const fileInfos = videoUploadQueueFileInfos(queueArgs);
            const lastIndex = videoUploadQueueLastIndex(queueArgs);
            
            //console.warn(lastIndex, fileInfos);

            return fileInfos && !isNaN(lastIndex) && lastIndex < fileInfos.length;
          },

          videoUploadQueueRemainingCount(
            queueArgs,
            { videoUploadQueueFileInfos, videoUploadQueueLastIndex }
          ) {
            const fileInfos = videoUploadQueueFileInfos(queueArgs);
            const lastIndex = videoUploadQueueLastIndex(queueArgs);

            return fileInfos && !isNaN(lastIndex) && fileInfos.length - lastIndex || 0;
          },

          videoUploadQueueTotalCount(
            queueArgs,
            { videoUploadQueueFileInfos, videoUploadQueueLastIndex }
          ) {
            const fileInfos = videoUploadQueueFileInfos(queueArgs);
            const lastIndex = videoUploadQueueLastIndex(queueArgs);

            return fileInfos && !isNaN(lastIndex) && fileInfos.length || 0;
          }
        },

        writers: {
          videoUploadQueueStart(
            uploadArgs,
            { },
            { },
            { videoUploadQueuePump, set_videoUploadQueue }
          ) {
            const { queueId, fileInfos } = uploadArgs;
            const onVideoUploaded = getOptionalArgument(uploadArgs, 'onVideoUploaded');

            const lastIndex = -1;
            const queueArgs = { queueId };
            set_videoUploadQueue(queueArgs, {
              fileInfos,
              lastIndex,
              onVideoUploaded
            });

            videoUploadQueuePump(queueArgs);
          },

          async videoUploadQueuePump(
            queueArgs,
            { videoUploadQueue },
            { },
            { startVideoUpload,
              videoUploadQueuePump,
              set_videoUploadQueueLastIndex }
          ) {
            const queueInfo = videoUploadQueue(queueArgs);

            const {
              fileInfos,
              lastIndex,
              onVideoUploaded
            } = queueInfo || EmptyObject;

            if (!queueInfo || !fileInfos || isNaN(lastIndex)) {
              // something must have gone wrong
              return;
            }

            const index = lastIndex + 1;
            if (index >= fileInfos.length) {
              // done!
              set_videoUploadQueueLastIndex(queueArgs, fileInfos.length);
              return;
            }

            const fileInfo = fileInfos[index];

            const onUploadComplete = (fileId, videoId) => {
              videoUploadQueuePump(queueArgs);
              onVideoUploaded && onVideoUploaded(fileId, videoId);
            };
            const uploadArgs = {
              ...fileInfo,
              onUploadComplete
            };
            if (await startVideoUpload(uploadArgs)) {
              set_videoUploadQueueLastIndex(queueArgs, index);
            }
          }
        },

        children: {
          videoUploadQueueFileInfos: 'fileInfos',
          videoUploadQueueLastIndex: 'lastIndex',
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
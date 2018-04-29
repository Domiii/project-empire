import MediaUploader from './MediaUploader';

// /**
//  * YouTube video uploader class
//  *
//  * @constructor
//  */
// const UploadVideo = function() {
//   /**
//    * The array of tags for the new YouTube video.
//    *
//    * @attribute tags
//    * @type Array.<string>
//    * @default ['google-cors-upload']
//    */
//   tags = ['youtube-cors-upload'];

//   /**
//    * The numeric YouTube
//    * [category id](https://developers.google.com/apis-explorer/#p/youtube/v3/youtube.videoCategories.list?part=snippet&regionCode=us).
//    *
//    * @attribute categoryId
//    * @type number
//    * @default 22
//    */
//   categoryId = 22;

//   /**
//    * The id of the new video.
//    *
//    * @attribute videoId
//    * @type string
//    * @default ''
//    */
//   videoId = '';

//   uploadStartTime = 0;
// };

export const YtUploadStatus = {
  None: 0,
  Uploading: 1,
  Processing: 2,
  Finished: 3
};

export default {
  ytVideoUploads: {
    path: 'videoUploads',
    writers: {
    },

    children: {
      ytVideoUpload: {
        path: '$(fileId)',

        writers: {
          async ytStartVideoUpload(
            queryArgs,
            { fetchStreamFile, get_ytUploadLastStartTime },
            { },
            { set_ytUploadInfo, set_ytUploader, set_ytUploadProgress,
              set_ytVideoId, set_ytUploadStatus, set_ytUploadError,
              set_ytUploadLastStartTime,
              set_ytUploadResult
            }
          ) {
            const {
              fileId
            } = queryArgs;
            const fileArgs = { fileId };

            const info = queryArgs; // TODO: maybe use already existing upload info, if already existing?
            set_ytUploadInfo(fileArgs, info);
            const file = await fetchStreamFile({ fileId });

            const {
              title,
              description,
              privacyStatus = 'unlisted',
              accessToken,
              tags,
              categoryId
            } = info;

            const metadata = {
              snippet: {
                title,
                description,
                tags,
                categoryId
              },
              status: {
                privacyStatus
              }
            };
            const uploader = new MediaUploader({
              baseUrl: 'https://www.googleapis.com/upload/youtube/v3/videos',
              file,
              token: accessToken,
              metadata,
              params: {
                part: Object.keys(metadata).join(',')
              },
              onError: (err) => {
                set_ytUploadError(fileArgs, err);
                //set_ytUploadStatus();
              },
              onStart: () => {
                set_ytUploadStatus(fileArgs, YtUploadStatus.Uploading);
                set_ytUploadLastStartTime(fileArgs, window.performance.now());
              },
              onProgress: (data) => {
                const uploadStartTime = get_ytUploadLastStartTime(fileArgs);
                const currentTime = window.performance.now();
                const bytesUploaded = data.loaded;
                const totalBytes = data.total;

                const bytesPerSecond = bytesUploaded / ((currentTime - uploadStartTime) / 1000);
                const estimatedSecondsRemaining = (totalBytes - bytesUploaded) / bytesPerSecond;
                const uploadPct = (bytesUploaded * 100) / totalBytes;

                set_ytUploadProgress(fileArgs, {
                  bytesUploaded,
                  totalBytes,
                  uploadPct,
                  bytesPerSecond,
                  estimatedSecondsRemaining
                });
              },
              onUploadComplete: (videoId) => {
                set_ytVideoId(fileArgs, videoId);
                set_ytUploadStatus(fileArgs, YtUploadStatus.Processing);
              },
              onProcessed: (data) => {
                set_ytUploadResult(data);
                set_ytUploadStatus(YtUploadStatus.Finished);
              }
            });
            uploader.upload();

            set_ytUploader(fileArgs, uploader);
          },

          // ytPauseUpload() {
          //   // TODO: pause
          //   set_ytUploadStatus
          // },

          // ytResumeUpload() {
          //   // TODO: resume
          //   set_ytUploadStatus
          // },

          // ytCancelUpload() {
          //   // TODO: cancel
          //   set_ytUploadStatus
          // }
        },

        children: {
          ytUploadStatus: {
            path: 'status',
            reader(val) {
              // TODO: also get retry + resume events from MediaUploader
              return val || YtUploadStatus.None;
            }
          },
          ytUploadInfo: {
            path: 'info',
          },
          ytUploader: {
            // use this to pause/resume/cancel upload
            path: 'uploader'
          },
          ytUploadLastStartTime: {
            // the time at which the last chunk upload started
            path: 'lastStartTime'
          },
          ytUploadProgress: {
            path: 'progress'
          },
          ytVideoId: {
            path: 'videoId'
          },
          ytUploadResult: {
            // player.embedHtml
            path: 'uploadResult'
          },
          ytUploadError: 'uploadError'
        }
      }
    }
  }
};
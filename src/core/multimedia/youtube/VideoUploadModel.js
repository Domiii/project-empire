import isPlainObject from 'lodash/isPlainObject';

import MediaUploader from './MediaUploader';
import { getOptionalArguments } from '../../../dbdi/dataAccessUtil';

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

export const VideoUploadStatus = {
  None: 0,
  Uploading: 1,
  Processing: 2,
  Finished: 3
};

export default {
  ytVideoUploads: {
    path: 'videoUploads',

    children: {
      ytVideoUpload: {
        path: '$(fileId)',

        readers: {
          ytIsVideoUploadInProgress(fileArgs, { videoUploadStatus }) {
            const status = videoUploadStatus(fileArgs);
            return status === VideoUploadStatus.Uploading || status === VideoUploadStatus.Processing;
          }
        },

        writers: {
          async ytStartVideoUpload(
            queryArgs,
            { fetchStreamFile, get_videoUploadLastStartTime, gapiTokens },
            { },
            { gapiHardAuth,
              set_videoUploadInfo, set_videoUploaderObject, set_videoUploadProgress,
              set_ytVideoId, set_videoUploadStatus, set_videoUploadError,
              set_videoUploadLastStartTime,
              set_ytDangerousHTMLEmbedCode,
              set_videoUploadResult
            }
          ) {
            const {
              fileId
            } = queryArgs;
            const fileArgs = { fileId };

            // first update status
            set_videoUploadStatus(fileArgs, VideoUploadStatus.Uploading);

            if (!await gapiHardAuth()) {
              // could not auth -> reset status
              set_videoUploadStatus(fileArgs, VideoUploadStatus.None);
              return false;
            }
            const accessToken = gapiTokens().access_token;

            if (!accessToken) {
              const err = '[INTERNAL ERROR] Could not retrieve access token';
              console.error(err);
              set_videoUploadError(fileArgs, err);
              set_videoUploadStatus(fileArgs, VideoUploadStatus.None);
              return false;
            }

            set_videoUploadError(fileArgs, null);

            const info = getOptionalArguments(queryArgs, {
              title: 'untitled video',
              description: '',
              tags: null,

              // see (categoryId): https://gist.github.com/dgp/1b24bf2961521bd75d6c
              categoryId: 22,
              privacyStatus: 'unlisted'
            });
            set_videoUploadInfo(fileArgs, info);
            const file = await fetchStreamFile({ fileId });

            const {
              title,
              description,
              tags,
              categoryId,
              privacyStatus
            } = info;

            const metadata = {
              snippet: {
                title: title,
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
                console.error('upload failed', err);
                if (isPlainObject(err)) {
                  err = JSON.stringify(err, null, 2);
                }
                set_videoUploadError(fileArgs, err);
                //set_videoUploadStatus();
              },
              onStart: () => {
                set_videoUploadStatus(fileArgs, VideoUploadStatus.Uploading);
                set_videoUploadLastStartTime(fileArgs, window.performance.now());
              },
              onProgress: (data) => {
                const uploadStartTime = get_videoUploadLastStartTime(fileArgs);
                const currentTime = window.performance.now();
                const bytesUploaded = data.loaded;
                const totalBytes = data.total;

                const bytesPerSecond = Math.round(bytesUploaded / ((currentTime - uploadStartTime) / 1000));
                const estimatedSecondsRemaining = Math.round((totalBytes - bytesUploaded) / bytesPerSecond);
                const uploadPct = Math.round((bytesUploaded * 100) / totalBytes);

                set_videoUploadProgress(fileArgs, {
                  bytesUploaded,
                  totalBytes,
                  uploadPct,
                  bytesPerSecond,
                  estimatedSecondsRemaining
                });
              },
              onUploadComplete: (videoId) => {
                set_ytVideoId(fileArgs, videoId);
                set_videoUploadStatus(fileArgs, VideoUploadStatus.Processing);
              },
              onProcessed: (data) => {
                set_videoUploadResult(fileArgs, data);

                // see https://zhenyong.github.io/react/tips/dangerously-set-inner-html.html
                set_ytDangerousHTMLEmbedCode(fileArgs, {
                  __html: data && data.player && data.player.embedHtml
                });
                set_videoUploadStatus(fileArgs, VideoUploadStatus.Finished);
              }
            });
            uploader.upload();

            set_videoUploaderObject(fileArgs, uploader);
            return true;
          },

          // ytPauseUpload() {
          //   // TODO: pause
          //   set_videoUploadStatus
          // },

          // ytResumeUpload() {
          //   // TODO: resume
          //   set_videoUploadStatus
          // },

          // ytCancelUpload() {
          //   // TODO: cancel
          //   set_videoUploadStatus
          // }
        },

        children: {
          videoUploadStatus: {
            path: 'status',
            reader(val) {
              // TODO: also get retry + resume events from MediaUploader
              return val || VideoUploadStatus.None;
            }
          },
          videoUploadInfo: {
            path: 'info',
          },
          videoUploaderObject: {
            // the MediaUploader object that controls/manages the upload events
            path: 'uploader'
          },
          videoUploadLastStartTime: {
            // the time at which the last chunk upload started
            path: 'lastStartTime'
          },
          videoUploadProgress: {
            path: 'progress'
          },
          ytVideoId: {
            path: 'videoId'
          },
          videoUploadResult: {
            // player.embedHtml
            path: 'uploadResult'
          },
          ytDangerousHTMLEmbedCode: 'dangerousHTMLEmbedCode',
          videoUploadError: 'uploadError'
        }
      }
    }
  }
};
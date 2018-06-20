import some from 'lodash/some';

import { EmptyObject } from '../../util';
import { NOT_LOADED } from '../../dbdi/react';

import { getOptionalArgument } from 'src/dbdi/dataAccessUtil';


/* globals window */
const {
  navigator,
  MediaRecorder,
  Blob
} = window;

export const MediaStatus = {
  Down: 0,
  Preparing: 1,
  Ready: 2,
  Running: 3,
  Paused: 4,
  Finished: 5
};

export function isElectron() {
  // NYI
  return false;
}

/**
 * @see https://github.com/muaz-khan/RecordRTC/blob/d5109285e7f83f45e8a4dad8064d4eb9ab36d321/dev/isMediaRecorderCompatible.js
 */
export function isMediaRecorderCompatible() {
  var isOpera = !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
  var isChrome = (!!window.chrome && !isOpera) || isElectron();
  var isFirefox = typeof window.InstallTrigger !== 'undefined';

  if (isFirefox) {
    return true;
  }

  var nVer = navigator.appVersion;
  var nAgt = navigator.userAgent;
  var fullVersion = '' + parseFloat(navigator.appVersion);
  var majorVersion = parseInt(navigator.appVersion, 10);
  var nameOffset, verOffset, ix;

  if (isChrome || isOpera) {
    verOffset = nAgt.indexOf('Chrome');
    fullVersion = nAgt.substring(verOffset + 7);
  }

  // trim the fullVersion string at semicolon/space if present
  if ((ix = fullVersion.indexOf(';')) !== -1) {
    fullVersion = fullVersion.substring(0, ix);
  }

  if ((ix = fullVersion.indexOf(' ')) !== -1) {
    fullVersion = fullVersion.substring(0, ix);
  }

  majorVersion = parseInt('' + fullVersion, 10);

  if (isNaN(majorVersion)) {
    fullVersion = '' + parseFloat(navigator.appVersion);
    majorVersion = parseInt(navigator.appVersion, 10);
  }

  return majorVersion >= 49;
}

/**
 * ############################################################
 * getStream
 * ############################################################
 */

export function getStream(constraints) {
  return navigator.mediaDevices.getUserMedia(constraints)
    .then(mediaStream => {
      return mediaStream;
    })
    .catch(err => {
      throw new Error('Could not get stream - ' + (err.stack || err));
    }); // always check for errors at the end.
}


/**
 * ############################################################
 * getDeviceList
 * ############################################################
 */

/**
 * Returns a promise which (if successful), yields an array of MediaDeviceInfo.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/MediaDeviceInfo
 */
export function getDeviceList() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
    return Promise.reject('Could not get media device list - enumerateDevices() not supported.');
  }

  // List cameras and microphones.

  return navigator.mediaDevices.enumerateDevices()
    .catch((err) => {
      throw new Error('Could not get media device list - ' + (err.stack || err));
    });
}


/**
 * ############################################################
 * getDefaultRecorderOptions
 * ############################################################
 */

/**
 * @see https://github.com/webrtc/samples/blob/1269739243f8f6063b3e3c19fb6562ca28d97069/src/content/getusermedia/record/js/main.js#L93
 */
function getDefaultRecorderOptions() {
  var options = { mimeType: 'video/webm;codecs=vp9' };
  if (!MediaRecorder.isTypeSupported(options.mimeType)) {
    console.log(options.mimeType + ' is not Supported');
    options = { mimeType: 'video/webm;codecs=vp8' };
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      console.log(options.mimeType + ' is not Supported');
      options = { mimeType: 'video/webm' };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        console.log(options.mimeType + ' is not Supported');
        options = { mimeType: '' };
      }
    }
  }
  return options;
}


/**
 * ############################################################
 * prepareRecorder
 * ############################################################
 */

function prepareRecorder(stream, streamArgs,
  { get_streamFileId, get_streamFileSegments },
  { streamFileWrite, set_streamFileSegments, set_streamStatus }
) {
  const recorder = new MediaRecorder(stream, getDefaultRecorderOptions());

  let fileId;
  let fileArgs;
  recorder.onstart = (e) => {
    console.warn('recorder.onstart');
    //console.log('MediaRecorder start');
    fileId = get_streamFileId(streamArgs);
    if (!fileId) {
      throw new Error('fileId not set when starting MediaRecorder');
    }

    fileArgs = { fileId };
    set_streamFileSegments(fileArgs, [{}]);
  };
  recorder.onpause = (e) => {
    //console.log('MediaRecorder pause');
    set_streamStatus(streamArgs, MediaStatus.Paused);
  };
  recorder.onresume = (e) => {
    // we are starting on a new segment
    set_streamStatus(streamArgs, MediaStatus.Running);
    const segments = get_streamFileSegments(fileArgs);
    if (!segments) return;

    // TODO: fix pushing to memory data provider!
    // add new segment. all new blobs will automatically be added to this segment
    segments.push({});
    set_streamFileSegments(fileArgs, segments);
    //console.log('MediaRecorder resume');
  };

  recorder.ondataavailable = (blobEvent) => {
    //console.log('blob: ' + e.data.size);
    //push_streamBlob(streamArgs, e.data);
    // write blob
    streamFileWrite({ fileId, blobEvent });
  };

  //recorder.start(10);

  return recorder;
}


/**
 * ############################################################
 * inputSelection
 * ############################################################
 */

const mediaInputSelection = {
  readers: {
    mediaInputConstraints(
      { },
      { },
      { hasSelectedInputMedia, videoDeviceId, audioDeviceId }
    ) {
      if (!hasSelectedInputMedia) {
        return NOT_LOADED;
      }

      const constraints = {};
      constraints.video = videoDeviceId && {
        deviceId: videoDeviceId,
        width: { ideal: 4096 },
        height: { ideal: 2160 }
      } || false;

      constraints.audio = audioDeviceId && {
        deviceId: audioDeviceId
      } || false;

      return constraints;
    },

    enumerateMediaDevices() {
      return getDeviceList();
    },

    hasSelectedInputMedia(
      { },
      { },
      { videoDeviceId, audioDeviceId }
    ) {
      return !!videoDeviceId || !!audioDeviceId;
    },

    isAnyStreamOnline(
      { },
      { streamStatus },
      { mediaStreams }
    ) {
      return some(mediaStreams, (stream, streamId) => {
        const s = streamStatus({ streamId });
        return s === MediaStatus.Running || s === MediaStatus.Paused;
      });
    }
  },

  children: {
    videoDeviceId: {
      path: 'videoDeviceId',
      // reader(val) {
      //   console.log('videoDeviceId', val);
      //   return val;
      // }
    },
    audioDeviceId: 'audioDeviceId'
  }
};


/**
 * ############################################################
 * StreamModel
 * ############################################################
 */

let lastStreamVersion = 0;

export default {
  mediaStreams: {
    path: '/multimedia/streams',

    writers: {
      async startStreamRecording(
        { streamId },
        readers,
        { mediaInputConstraints },
        writers
      ) {
        const streamArgs = { streamId };
        const { get_mediaStreams, get_streamObject } = readers;
        const { set_mediaStream, set_mediaStreams,
          set_streamObject,
          set_streamRecorderObject, stopStreamRecorder,
          set_streamStatus,
          initStreamFs
        } = writers;

        set_streamStatus(streamArgs, MediaStatus.Preparing);

        // make sure, previous stream (if any) is dead
        //shutdownStream(streamArgs);
        {
          await stopStreamRecorder(streamArgs);
        }

        const streamPromise = get_streamObject(streamArgs) || getStream(mediaInputConstraints);
        //const fileIdPromise = get_streamFileId(streamArgs) || newStreamFile();

        return Promise.all([
          streamPromise,
          initStreamFs()
        ]).then(([streamObject, fileId]) => {
          set_mediaStream(streamArgs, {});
          const streamVersion = ++lastStreamVersion;

          // hack: notify any listener of `isAnyStreamOnline`
          get_mediaStreams.notifyPathChanged();

          // TODO: properly setup the recorder
          // see: https://github.com/muaz-khan/RecordRTC/tree/master/dev/MediaStreamRecorder.js

          if (streamVersion !== lastStreamVersion) {
            // things changed -> don't keep doing this thing
            return;
          }

          // return Promise.all([
          set_streamObject(streamArgs, streamObject);
          set_streamStatus(streamArgs, MediaStatus.Ready);

          const mediaRecorder = prepareRecorder(streamObject, streamArgs, readers, writers);
          set_streamRecorderObject(streamArgs, mediaRecorder);
          // ]);
        }).then(() => streamId)
          .catch(err => {
            console.error(err.stack || err);
            set_streamStatus(streamArgs, MediaStatus.Down);
          });
      }
    },

    readers: {
      isMediaRecorderCompatible
    },

    children: {
      mediaInputSelection,

      mediaStream: {
        path: '$(streamId)',

        readers: {
          /**
           * Whether there is nothing happening at all
           */
          isStreamDown(
            streamArgs,
            { streamStatus }
          ) {
            const status = streamStatus(streamArgs);
            return status === MediaStatus.Down;
          },

          /**
           * Whether stream down or trying to get it up
           */
          isStreamOffline(
            streamArgs,
            { streamStatus }
          ) {
            const status = streamStatus(streamArgs);
            return status <= MediaStatus.Preparing;
          },

          isStreamReady(
            streamArgs,
            { streamStatus }
          ) {
            const status = streamStatus(streamArgs);
            return status === MediaStatus.Ready;
          },

          isStreamActive(
            streamArgs,
            { streamStatus }
          ) {
            const status = streamStatus(streamArgs);
            return status === MediaStatus.Running ||
              status === MediaStatus.Paused;
          },

          streamSize(streamArgs,
            { streamFileId, streamFileSize }
          ) {
            const fileId = streamFileId(streamArgs);
            if (!fileId) {
              return 0;
            }
            return streamFileSize({ fileId });
          },

          streamDuration(streamArgs,
            { streamFileId, streamFileDuration }
          ) {
            const fileId = streamFileId(streamArgs);
            if (!fileId) {
              return 0;
            }
            return streamFileDuration({ fileId });
          },

          streamUrl(streamArgs,
            { streamFileId, streamFileUrl }
          ) {
            const fileId = streamFileId(streamArgs);
            if (!fileId) {
              return null;
            }
            return streamFileUrl({ fileId });
          },

          streamGetVolume(
            streamArgs,
            { streamObject }
          ) {
            const stream = streamObject(streamArgs);
            if (!stream) {
              return stream;
            }

            // shutdown all streams
            let volume;
            stream.getTracks().forEach(track => {
              const settings = track.getSettings();
              if (settings && settings.volume) {
                volume = settings.volume;
              }
            });

            return volume;
          },

          streamVideoResolution(
            streamArgs,
            { streamObject }
          ) {
            const stream = streamObject(streamArgs);
            if (!stream) {
              return stream;
            }

            const res = {
              width: 0,
              height: 0
            };
            stream.getTracks().forEach(track => {
              const settings = track.getSettings();
              res.width = settings && settings.width || 0;
              res.height = settings && settings.height || 0;
            });

            return res.width === 0 ? null : res;
          }
        },

        writers: {
          async shutdownStream(
            streamArgs,
            { streamObject },
            { },
            { set_streamObject,
              //set_streamStatus,
              stopStreamRecorder }
          ) {
            const stream = streamObject(streamArgs);
            if (stream) {
              // shutdown all streams
              stream.getTracks().forEach(track => track.stop());

              set_streamObject(streamArgs, null);
              //set_streamStatus(streamArgs, MediaStatus.Down);
              //set_streamFileId(streamArgs, null);
              return await stopStreamRecorder(streamArgs);
            }
          }
        },

        children: {
          streamFileId: 'fileId',

          streamStatus: {
            path: 'streamStatus',
            reader(status) {
              if (!status) {
                return MediaStatus.Down;
              }
              return status;
            }
          },

          streamObject: {
            path: 'streamObject'
          },

          streamRecorder: {
            path: 'streamRecorder',
            children: {
              streamRecorderObject: 'recorderObject'
            },

            readers: {
              streamRecorderMimeType(
                streamArgs,
                { streamRecorderObject }
              ) {
                const recorder = streamRecorderObject(streamArgs);
                return recorder && recorder.mimeType;
              }
            },

            writers: {
              startStreamRecorder(
                streamArgs,
                { streamRecorderObject, get_streamFileId },
                { },
                { set_streamStatus, shutdownStream }
              ) {
                const fileId = get_streamFileId(streamArgs);
                if (!fileId) {
                  setTimeout(() => shutdownStream(streamArgs));
                  throw new Error('fileId not set when starting MediaRecorder');
                }
                
                const segmentLength = getOptionalArgument(streamArgs, 'timeout');
                const recorder = streamRecorderObject(streamArgs);
                recorder.start(segmentLength || 40);

                return set_streamStatus(streamArgs, MediaStatus.Running);
              },

              async stopStreamRecorder(
                streamArgs,
                { streamObject, streamRecorderObject, streamStatus },
                { },
                { set_streamStatus, set_streamRecorderObject }
              ) {
                //const { timeout } = streamArgs;
                const recorder = streamRecorderObject(streamArgs);

                if (!recorder || !!recorder.onstop || recorder.state === 'inactive') {
                  return false;
                }

                const oldStream = streamObject(streamArgs);

                const result = new Promise((resolve, reject) => {
                  recorder.onstop = (e) => {
                    console.log('MediaRecorder finished recording');

                    if (oldStream === streamObject(streamArgs) && 
                      streamStatus(streamArgs) < MediaStatus.Finished) {
                      set_streamStatus(streamArgs, MediaStatus.Finished);
                      set_streamRecorderObject(streamArgs, null);
                    }
                    resolve(true);
                  };
                });

                recorder.stop();

                return await result;
              },

              pauseStreamRecorder(
                streamArgs,
                { streamRecorderObject }
              ) {
                //const { timeout } = streamArgs;
                const recorder = streamRecorderObject(streamArgs);

                recorder.pause();
              },

              resumeStreamRecorder(
                streamArgs,
                { streamRecorderObject }
              ) {
                //const { timeout } = streamArgs;
                const recorder = streamRecorderObject(streamArgs);

                recorder.resume();
              }
            }
          }
        }
      }
    }
  }
};
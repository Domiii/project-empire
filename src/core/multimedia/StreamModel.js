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
  NotReady: 0,
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

function prepareRecorder(stream, streamArgs, fileId,
  { get_streamFileSegments },
  { streamFileWrite, set_streamFileSegments, set_streamStatus }
) {
  const recorder = new MediaRecorder(stream, getDefaultRecorderOptions());
  const fileArgs = { fileId };

  set_streamFileSegments(fileArgs, [{}]);

  recorder.onstart = (e) => {
    //console.log('MediaRecorder start');
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
        deviceId: videoDeviceId
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
    videoDeviceId: 'videoDeviceId',
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
        const { get_mediaStreams, get_streamObject, get_streamFileId } = readers;
        const { set_mediaStream, set_mediaStreams,
          set_streamObject,
          set_streamRecorderObject, stopStreamRecorder,
          set_streamStatus,
          newStreamFile, set_streamFileId,
          shutdownStream,
          initStreamFs
        } = writers;

        // make sure, previous stream (if any) is dead
        //shutdownStream(streamArgs);
        {
          await stopStreamRecorder(streamArgs);
          set_streamRecorderObject(streamArgs, null);
        }

        set_streamStatus(streamArgs, MediaStatus.Preparing);

        const streamPromise = get_streamObject(streamArgs) || getStream(mediaInputConstraints);
        const fileIdPromise = get_streamFileId(streamArgs) || newStreamFile();

        return Promise.all([
          streamPromise,
          fileIdPromise,
          initStreamFs()
        ]).then(([streamObject, fileId]) => {
          set_mediaStream(streamArgs, {});
          const streamVersion = ++lastStreamVersion;

          // hack: notify any listener of `isAnyStreamOnline`
          set_mediaStreams(get_mediaStreams());

          // TODO: properly setup the recorder
          // see: https://github.com/muaz-khan/RecordRTC/tree/master/dev/MediaStreamRecorder.js

          if (streamVersion !== lastStreamVersion) {
            // things changed -> don't keep doing this thing
            return;
          }

          // return Promise.all([
          set_streamObject(streamArgs, streamObject);
          set_streamStatus(streamArgs, MediaStatus.Ready);
          set_streamFileId(streamArgs, fileId);

          const mediaRecorder = prepareRecorder(streamObject, streamArgs, fileId, readers, writers);
          set_streamRecorderObject(streamArgs, mediaRecorder);
          // ]);
        }).then(() => streamId)
          .catch(err => {
            console.error(err.stack || err);
            set_streamStatus(streamArgs, MediaStatus.NotReady);
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
          isStreamReady(
            { streamId },
            { streamStatus }
          ) {
            const status = streamStatus({ streamId });
            return status === MediaStatus.Ready;
          },

          isStreamActive(
            { streamId },
            { streamStatus }
          ) {
            const status = streamStatus({ streamId });
            return status === MediaStatus.Running ||
              status === MediaStatus.Paused;
          },

          isStreamOffline(
            { streamId },
            { streamStatus }
          ) {
            const status = streamStatus({ streamId });
            return status <= MediaStatus.Preparing;
          },

          streamSize(streamArgs,
            { streamFileId, streamFileSize }
          ) {
            return streamFileSize({ fileId: streamFileId(streamArgs) });
          },

          streamDuration(streamArgs,
            { streamFileId, streamFileDuration }
          ) {
            return streamFileDuration({ fileId: streamFileId(streamArgs) });
          },

          streamUrl(streamArgs,
            { streamFileId, streamFileUrl }
          ) {
            return streamFileUrl({ fileId: streamFileId(streamArgs) });
          }
        },

        writers: {
          shutdownStream(
            streamArgs,
            { streamObject, streamRecorderObject },
            { },
            { set_streamObject,
              set_streamRecorderObject,
              set_streamStatus,
              set_streamFileId }
          ) {
            const stream = streamObject(streamArgs);
            if (stream) {
              // shutdown all streams
              stream.getTracks().forEach(track => track.stop());

              set_streamObject(streamArgs, null);
              set_streamRecorderObject(streamArgs, null);
              set_streamStatus(streamArgs, MediaStatus.NotReady);
              //set_streamFileId(streamArgs, null);
            }
          }
        },

        children: {
          streamFileId: 'fileId',

          streamStatus: {
            path: 'streamStatus',
            reader(status) {
              if (!status) {
                return MediaStatus.NotReady;
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
                { streamRecorderObject },
                { },
                { set_streamStatus }
              ) {
                const segmentLength = getOptionalArgument(streamArgs, 'timeout');
                const recorder = streamRecorderObject(streamArgs);
                recorder.start(segmentLength || 40);

                return set_streamStatus(streamArgs, MediaStatus.Running);
              },

              async stopStreamRecorder(
                streamArgs,
                { streamRecorderObject },
                { },
                { set_streamStatus }
              ) {
                //const { timeout } = streamArgs;
                const recorder = streamRecorderObject(streamArgs);

                if (!recorder || !!recorder.onstop || recorder.state === 'inactive') {
                  return false;
                }

                const result = new Promise((resolve, reject) => {
                  recorder.onstop = (e) => {
                    console.log('MediaRecorder finished recording');

                    set_streamStatus(streamArgs, MediaStatus.Finished);
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
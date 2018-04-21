import some from 'lodash/some';
import first from 'lodash/first';
import last from 'lodash/last';

import { EmptyObject } from '../../util';
import { NOT_LOADED } from '../../dbdi/react';


/* globals window */
const {
  navigator,
  MediaRecorder
} = window;

export const MediaStatus = {
  NotReady: 0,
  Preparing: 1,
  Ready: 2,
  Running: 3,
  Paused: 4,
  Finished: 5
};

export const DefaultMimeType = 'video/webm';

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
      console.error('Could not get stream - ' + (err.stack || err), constraints);
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
  { get_streamBlobs },
  { set_streamBlobs, push_streamBlob, add_streamSize }
) {
  const recorder = new MediaRecorder(stream, getDefaultRecorderOptions());

  const blobs = [];

  set_streamBlobs(streamArgs, blobs);

  recorder.onstart = (e) => {
    console.log('MediaRecorder start');
  };
  recorder.onpause = (e) => {
    console.log('MediaRecorder pause');
  };
  recorder.onresume = (e) => {
    console.log('MediaRecorder resume');
  };
  recorder.onstop = (e) => {
    console.log('MediaRecorder finished recording');

    //var blob = new window.Blob(chunks, { 'type': 'audio/ogg; codecs=opus' });
    // var audioURL = window.URL.createObjectURL(blob);
    // audio.src = audioURL;
  };

  recorder.ondataavailable = function (blobEvent) {
    //console.log('blob: ' + e.data.size);
    //push_streamBlob(streamArgs, e.data);

    if (get_streamBlobs(streamArgs) !== blobs) {
      // a different show is running!
      return;
    }

    // add blob
    // TODO: fix pushing to memory data provider!
    const blob = blobEvent.data;
    blobs.push(blobEvent);
    set_streamBlobs(streamArgs, blobs);

    // update size
    add_streamSize({ ...streamArgs, amount: blob.size });
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
      { isStreamOffline },
      { mediaStreams }
    ) {
      return some(mediaStreams, (stream, streamId) => !isStreamOffline({ streamId }));
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

export default {
  mediaStreams: {
    path: '/multimedia/streams',

    writers: {
      startStreamRecording(
        { streamId },
        readers,
        { mediaInputConstraints },
        writers
      ) {
        const streamArgs = { streamId };
        const { get_mediaStreams } = readers;
        const { set_mediaStream, set_mediaStreams,
          set_streamObject,
          set_streamRecorderObject,
          set_streamStatus } = writers;
        set_mediaStream(streamArgs, {});
        set_streamStatus(streamArgs, MediaStatus.Preparing);

        // notify any listener of `isAnyStreamOnline`
        set_mediaStreams(get_mediaStreams());

        return getStream(mediaInputConstraints).then((stream) => {
          // TODO: properly setup the recorder
          // see: https://github.com/muaz-khan/RecordRTC/tree/master/dev/MediaStreamRecorder.js
          const mediaRecorder = prepareRecorder(stream, streamArgs, readers, writers);

          // return Promise.all([
          set_streamObject(streamArgs, stream);
          set_streamRecorderObject(streamArgs, mediaRecorder);
          set_streamStatus(streamArgs, MediaStatus.Ready);
          // ]);
        }).then(() => streamId);
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
          }
        },

        writers: {
          stopStream(
            streamArgs,
            { streamObject },
            { },
            { set_streamObject,
              set_streamRecorderObject,
              set_streamStatus,
              set_streamData }
          ) {
            const stream = streamObject(streamArgs);
            if (stream) {
              stream.getTracks().forEach(track => track.stop());

              set_streamData(streamArgs, null);
              set_streamObject(streamArgs, null);
              set_streamRecorderObject(streamArgs, null);
              set_streamStatus(streamArgs, MediaStatus.NotReady);
            }
          }
        },

        children: {
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

          streamData: {
            path: 'data',
            writers: {
              add_streamSize(
                streamArgs,
                { get_streamSize },
                { },
                { set_streamSize }
              ) {
                const { amount } = streamArgs;
                const oldAmount = get_streamSize(streamArgs);
                set_streamSize(streamArgs, oldAmount + amount);
              }
            },
            readers: {
              streamDuration(
                streamArgs,
                { get_streamBlobs }
              ) {
                const blobs = get_streamBlobs(streamArgs);
                if (blobs && blobs.length) {
                  return last(blobs).timecode - first(blobs).timecode;
                }
                return 0;
              }
            },
            children: {
              streamBlobs: {
                path: 'blobs',
                children: {
                  streamBlob: '$(blobId)'
                }
              },

              streamSize: {
                path: 'streamSize',
                reader(val) {
                  return val || 0;
                }
              }
            }
          },

          streamRecorder: {
            path: 'streamRecorder',
            children: {
              streamRecorderObject: 'recorderObject'
            },

            writers: {
              startStreamRecorder(
                streamArgs,
                { streamRecorderObject },
                { },
                { set_streamStatus }
              ) {
                const { timeout } = streamArgs;
                const recorder = streamRecorderObject(streamArgs);
                recorder.start(timeout || 10);

                return set_streamStatus(streamArgs, MediaStatus.Running);
              },

              stopStreamRecorder(
                streamArgs,
                { streamRecorderObject },
                { },
                { set_streamStatus }
              ) {
                //const { timeout } = streamArgs;
                const recorder = streamRecorderObject(streamArgs);

                return new Promise((resolve, reject) => {
                  recorder.stop(() => {
                    const result = set_streamStatus(streamArgs, MediaStatus.Finished);
                    resolve(result);
                  });
                });
              },

              pauseStreamRecorder(
                streamArgs,
                { streamRecorderObject },
                { },
                { set_streamStatus }
              ) {
                //const { timeout } = streamArgs;
                const recorder = streamRecorderObject(streamArgs);

                recorder.pause();
                return set_streamStatus(streamArgs, MediaStatus.Paused);
              },

              resumeStreamRecorder(
                streamArgs,
                { streamRecorderObject },
                { },
                { set_streamStatus }
              ) {
                //const { timeout } = streamArgs;
                const recorder = streamRecorderObject(streamArgs);

                recorder.resume();
                return set_streamStatus(streamArgs, MediaStatus.Running);
              }
            }
          }
        }
      }
    }
  }
};
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
  { get_streamSegments, get_streamSegmentBlobs, currentSegmentId, get_mediaStream },
  { set_streamSegments, set_streamSegmentBlobs, push_streamSegmentBlob, add_streamSize, set_streamStatus }
) {
  const recorder = new MediaRecorder(stream, getDefaultRecorderOptions());

  set_streamSegments(streamArgs, [{}]);

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
    const segments = get_streamSegments(streamArgs);
    if (!segments) return;

    // TODO: fix pushing to memory data provider!
    // add new segment. all new blobs will automatically be added to this segment
    segments.push({});
    set_streamSegments(streamArgs, segments);
    //console.log('MediaRecorder resume');
  };
  recorder.onstop = (e) => {
    console.log('MediaRecorder finished recording');

    set_streamStatus(streamArgs, MediaStatus.Finished);
  };

  recorder.ondataavailable = (blobEvent) => {
    //console.log('blob: ' + e.data.size);
    //push_streamBlob(streamArgs, e.data);
    const segmentIndex = currentSegmentId(streamArgs);
    if (segmentIndex === NOT_LOADED) {
      console.error('recorder is recording, but no segmentIndex is set:', segmentIndex, '-', get_mediaStream(streamArgs));
      return;
    }

    const streamSegmentArgs = { ...streamArgs, segmentIndex };
    const blobs = get_streamSegmentBlobs(streamSegmentArgs);

    // add blob
    blobs.push(blobEvent);
    set_streamSegmentBlobs(streamSegmentArgs, blobs);

    // update size
    const blob = blobEvent.data;
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
          shutdownStream(
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
                const timeout = getOptionalArgument(streamArgs, 'timeout');
                const recorder = streamRecorderObject(streamArgs);
                recorder.start(timeout || 10);

                return set_streamStatus(streamArgs, MediaStatus.Running);
              },

              stopStreamRecorder(
                streamArgs,
                { streamRecorderObject }
              ) {
                //const { timeout } = streamArgs;
                const recorder = streamRecorderObject(streamArgs);
                recorder.stop();
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
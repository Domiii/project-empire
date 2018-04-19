import reduce from 'lodash/reduce';


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
  var isOpera = !!window.opera || window.navigator.userAgent.indexOf(' OPR/') >= 0;
  var isChrome = (!!window.chrome && !isOpera) || isElectron();
  var isFirefox = typeof window.InstallTrigger !== 'undefined';

  if (isFirefox) {
    return true;
  }

  var nVer = window.navigator.appVersion;
  var nAgt = window.navigator.userAgent;
  var fullVersion = '' + parseFloat(window.navigator.appVersion);
  var majorVersion = parseInt(window.navigator.appVersion, 10);
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
    fullVersion = '' + parseFloat(window.navigator.appVersion);
    majorVersion = parseInt(window.navigator.appVersion, 10);
  }

  return majorVersion >= 49;
}

/**
 * ############################################################
 * getStream
 * ############################################################
 */

export function getStream(constraints) {
  return window.navigator.mediaDevices.getUserMedia(constraints)
    .then(mediaStream => {
      return mediaStream;
    })
    .catch(err => {
      console.error('Could not get stream - ' + err.stack);
    }); // always check for errors at the end.
}

function prepareRecorder(recorder, streamArgs, set_streamBlobs, push_streamBlobs) {
  set_streamBlobs(streamArgs, []);

  recorder.onstart = function (e) {
    console.log('MediaRecorder start');
  };
  recorder.onpause = function (e) {
    console.log('MediaRecorder pause');
  };
  recorder.onresume = function (e) {
    console.log('MediaRecorder resume');
  };
  recorder.onstop = function (e) {
    console.log('MediaRecorder finished recording');

    //var blob = new window.Blob(chunks, { 'type': 'audio/ogg; codecs=opus' });
    // var audioURL = window.URL.createObjectURL(blob);
    // audio.src = audioURL;
  };

  recorder.ondataavailable = function (e) {
    console.log('blob: ' + e.data.size);
    push_streamBlobs(streamArgs, e.data);
  };
}

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
        { streamId, constraints },
        { },
        { },
        { set_mediaStream,
          set_streamObject,
          set_streamRecorderObject,
          set_streamStatus,
          set_streamBlobs, push_streamBlobs }
      ) {
        const streamArgs = { streamId };
        const res = set_mediaStream(streamArgs, {
          streamStatus: MediaStatus.Preparing
        });

        console.log(res);

        return getStream(constraints).then((stream) => {
          // TODO: properly setup the recorder
          // see: https://github.com/muaz-khan/RecordRTC/tree/master/dev/MediaStreamRecorder.js
          const mediaRecorder = new window.MediaRecorder(stream);
          prepareRecorder(mediaRecorder, streamArgs, set_streamBlobs, push_streamBlobs);

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
      mediaStream: {
        path: '$(streamId)',

        readers: {
          streamSize(
            { streamId },
            { streamBlobs }
          ) {
            const blobs = streamBlobs({ streamId });
            return reduce(blobs, (sum, b) => sum + b.size, 0);
          },

          isStreamActive(
            { streamId },
            { streamStatus }
          ) {
            const status = streamStatus({ streamId });
            return status === MediaStatus.Ready ||
              status === MediaStatus.Running ||
              status === MediaStatus.Paused;
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
              set_streamBlobs }
          ) {
            const stream = streamObject(streamArgs);
            if (stream) {
              stream.getTracks().forEach(track => track.stop());

              set_streamBlobs(streamArgs, null);
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

          streamBlobs: {
            path: 'blobs',
            children: {
              streamBlob: '$(blobId)'
            }
          },

          streamRecorder: {
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
                recorder.start(timeout);

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
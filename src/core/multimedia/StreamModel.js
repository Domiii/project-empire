import reduce from 'lodash/reduce';


export const MediaStatus = {
  NotReady: 0,
  Ready: 2,
  Started: 3,
  Paused: 4,
  Finished: 5
};

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


/**
 * ############################################################
 * StreamModel
 * ############################################################
 */

export default {
  mediaStreams: {
    path: '/multimedia/streams',

    writers: {
      newStreamRecording(
        { constraints },
        { },
        { },
        { push_mediaStreams,
          set_streamObject,
          set_streamRecorderObject,
          set_streamStatus }
      ) {
        const res = push_mediaStreams({ 
          streamStatus: MediaStatus.NotReady 
        });
        
        const streamId = res.key;
        const streamArgs = { streamId };
  
        return getStream(constraints).then((stream) => {
          const mediaRecorder = new window.MediaRecorder(stream);
          // return Promise.all([
          set_streamObject(streamArgs, stream);
          set_streamRecorderObject(streamArgs, mediaRecorder);
          set_streamStatus(streamArgs, MediaStatus.Ready);
          // ]);
        }).then(() => streamId);
      }
    },

    children: {
      mediaStream: {
        path: '$(streamId)',

        readers: {
          streamSize(
            { },
            { streamBlobs }
          ) {
            const blobs = streamBlobs();
            return reduce(blobs, (sum, b) => sum + b.size, 0);
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
            path: 'streamObj'
          },

          children: {
            streamBlobs: {
              path: 'blobs',
              children: {
                blob: '$(blobId)'
              }
            }
          },

          streamRecorder: {
            children: {
              streamRecorderObject: 'recorderObject'
            }
          }
        }
      }
    }
  }
};
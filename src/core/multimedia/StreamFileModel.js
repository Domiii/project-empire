import map from 'lodash/map';
import flatten from 'lodash/flatten';
import reduce from 'lodash/reduce';
import first from 'lodash/first';
import last from 'lodash/last';

import { EmptyObject } from '../../util';
import { NOT_LOADED } from '../../dbdi/react';

import fs from 'bro-fs';

// (async() => {
//   await fs.init({ type: window.TEMPORARY, bytes: 5 * 1024 * 1024 });
//   // await fs.mkdir('dir');
//   // await fs.writeFile('dir/file.txt', 'hello world');
//   // const content = await fs.readFile('dir/file.txt');
//   console.log(await fs.readdir('dir', { deep: true })); // => "hello world"
// })();


/* globals window */
const {
  Blob
} = window;


export default {
  streamFiles: {
    path: 'streamFiles',
    streamFile: {
      path: '$(fileId)',

      readers: {
        streamFileDuration(
          streamFileArgs,
          { get_streamSegments, streamSegmentDuration }
        ) {
          // the total duration of the stream, across all segments
          const segments = get_streamSegments(streamFileArgs);
          return reduce(segments, (sum, segment, segmentIndex) =>
            sum + streamSegmentDuration(Object.assign({}, streamFileArgs, { segmentIndex })),
            0);
        },

        streamFileSize(
          streamFileArgs,
          { get_streamSegments, streamSegmentSize }
        ) {
          // the total size of the stream, across all segments
          const segments = get_streamSegments(streamFileArgs);
          return reduce(segments, (sum, segment, segmentIndex) =>
            sum + streamSegmentSize(Object.assign({}, streamFileArgs, { segmentIndex })),
            0);
        },

        currentSegmentId(
          streamFileArgs,
          { get_streamSegments }
        ) {
          const segments = get_streamSegments(streamFileArgs);
          return segments ? segments.length - 1 : NOT_LOADED;
        },

        streamFileUrl(
          streamFileArgs
        ) {
          // TODO: generate URL to access the underlying filesystem file
          // TODO: returns a promise.
          // see: https://github.com/vitalets/bro-fs/tree/master/src/index.js#L237
          return fs.getUrl(path);
        }

        // buildStreamFileObjectFromBlobs(
        //   streamArgs,
        //   { get_streamSegments, streamRecorderMimeType },
        //   { }
        // ) {
        //   const allSegments = get_streamSegments(streamArgs);
        //   const mimeType = streamRecorderMimeType(streamArgs);
        //   const fileName = 'stream.webm';
        //   //const mimeType = get_streamRecorderObject(streamArgs).mimeType;
        //   const allBlobs = map(flatten(map(allSegments, 'blobs')), 'data');
        //   return new window.File(allBlobs, fileName, { type: mimeType });
        // },

        // buildStreamFileSuperBlob(
        //   streamArgs,
        //   { get_streamSegments },
        //   { }
        // ) {
        //   const allSegments = get_streamSegments(streamArgs);
        //   //const mimeType = get_streamRecorderObject(streamArgs).mimeType;
        //   const allBlobs = map(flatten(map(allSegments, 'blobs')), 'data');
        //   return new Blob(allBlobs);
        // }
      },
      children: {
        streamSegments: {
          path: 'segments',
          children: {
            streamSegment: {
              path: '$(segmentIndex)',
              readers: {
                streamSegmentDuration(
                  streamSegmentArgs,
                  { streamSegmentStartTime, streamSegmentEndTime }
                ) {
                  const start = streamSegmentStartTime(streamSegmentArgs);
                  const end = streamSegmentEndTime(streamSegmentArgs);
                  return end - start;
                }
              },
              writers: {
                addStreamFileBlob(queryArgs, blobEvent,
                  { get_streamSegmentBlobCount, get_streamSegmentSize },
                  { },
                  { set_streamSegmentStartTime, set_streamSegmentEndTime, set_streamSegmentBlobCount, set_streamSegmentSize }
                ) {
                  // TOOD: actually store the blob in file

                  // adding a blob (to the end), always adds one to blob count, and always updates the new "end time".
                  const blobCount = get_streamSegmentBlobCount(queryArgs);
                  const size = get_streamSegmentSize(queryArgs);
                  const end = blobEvent.timecode || 0;
                  const promises = [
                    set_streamSegmentEndTime(queryArgs, end),
                    set_streamSegmentBlobCount(queryArgs, blobCount + 1),
                    set_streamSegmentSize(queryArgs, size + blobEvent.data.size)
                  ];

                  if (blobCount === 0) {
                    // first blob
                    const start = blobEvent.timecode || 0;
                    promises.push(set_streamSegmentStartTime(queryArgs, start));
                  }
                  return Promise.all(promises);
                },
              },
              children: {
                streamSegmentStartTime: {
                  path: 'startTime',
                  reader(val) {
                    return val || 0;
                  }
                },
                streamSegmentEndTime: {
                  path: 'endTime',
                  reader(val) {
                    return val || 0;
                  }
                },
                streamSegmentBlobCount: {
                  path: 'blobCount',
                  reader(val) {
                    return val || 0;
                  }
                },
                streamSegmentSize: {
                  path: 'size',
                  reader(val) {
                    return val || 0;
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};
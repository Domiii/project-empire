import map from 'lodash/map';
import flatten from 'lodash/flatten';
import reduce from 'lodash/reduce';
import first from 'lodash/first';
import last from 'lodash/last';

import { EmptyObject } from '../../util';
import { NOT_LOADED } from '../../dbdi/react';

import fs from 'bro-fs';
import uuid from 'uuid/v1';

const FileDirName = '/streamFiles';
const MetaFileDirName = '/streamFiles.meta';
const DefaultFileSystemConfig = {
  type: window.PERSISTENT,
  bytes: 1024 * 1024 * 1024
};

const StreamFsStatus = {
  None: 0,
  Ready: 1,
  Failed: 2
};

function getFilePath(fileId) {
  return FileDirName + '/' + fileId;
}

function getMetaFilePath(fileId) {
  return MetaFileDirName + '/' + fileId;
}


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
    writers: {
      async initStreamFs(queryArgs,
        { },
        { streamFsStatus },
        { set_streamFsStatus }
      ) {
        if (streamFsStatus === StreamFsStatus.Ready) { return; }

        // not ready -> initialize first!
        try {
          // initialize
          await fs.init(DefaultFileSystemConfig);

          // make sure, the directory exists
          await fs.mkdir(FileDirName);

          // update status
          set_streamFsStatus(StreamFsStatus.Ready);
        }
        catch (err) {
          console.error('Could not initialize filesystem: ' + (err.stack || err));
          set_streamFsStatus(StreamFsStatus.Failed);
        }
      },

      /**
       * (1) initialize filesystem
       * (2) generate new fileId
       * (3) open file
       * (4) return fileId (async)
       */
      async newStreamFile(
        { },
        { },
        { },
        { initStreamFs, _streamFileOpen }
      ) {
        await initStreamFs();
        const fileId = uuid();
        const fileArgs = { fileId };
        await _streamFileOpen(fileArgs);
        return fileId;
      }
    },
    children: {
      streamFsStatus: 'streamFsStatus',
      streamFileDirectory: {
        path: 'streamFileDirectory',
        readers: {
          streamFileList(
            { },
            { get__streamFileList },
            { },
            { initStreamFs, set__streamFileList }
          ) {
            const list = get__streamFileList();
            if (list) return list;

            // not loaded yet
            initStreamFs()
              .then(() => fs.readdir(FileDirName))
              .then(set__streamFileList);
            return NOT_LOADED;
          }
        },
        children: {
          _streamFileList: '_streamFileList'
        }
      },
      streamFile: {
        path: '$(fileId)',

        readers: {
          streamFilePath({ fileId }) {
            return getFilePath(fileId);
          },

          streamFileDuration(
            streamFileArgs,
            { get_streamFileSegments, streamFileSegmentDuration }
          ) {
            // the total duration of the stream, across all segments
            const segments = get_streamFileSegments(streamFileArgs);
            return reduce(segments, (sum, segment, segmentIndex) =>
              sum + streamFileSegmentDuration(Object.assign({}, streamFileArgs, { segmentIndex })),
              0);
          },

          streamFileSize(
            streamFileArgs,
            { get_streamFileSegments, streamFileSegmentSize }
          ) {
            // the total size of the stream, across all segments
            const segments = get_streamFileSegments(streamFileArgs);
            return reduce(segments, (sum, segment, segmentIndex) =>
              sum + streamFileSegmentSize(Object.assign({}, streamFileArgs, { segmentIndex })),
              0);
          },

          currentSegmentId(
            streamFileArgs,
            { get_streamFileSegments }
          ) {
            const segments = get_streamFileSegments(streamFileArgs);
            return segments ? segments.length - 1 : NOT_LOADED;
          },
        },

        writers: {
          /**
           * Create and store new file
           */
          async _streamFileOpen(queryArgs,
            { _streamFileList },
            { },
            { set_streamFileWriter, set__streamFileList }
          ) {
            // create and/or open file
            // see: https://github.com/vitalets/bro-fs/tree/master/src/index.js#L237
            const path = getFilePath(queryArgs.fileId);
            await fs.writeFile(path, ''); // create/reset file
            const fileEntry = await fs.getEntry(path);
            const writer = await new Promise((resolve, reject) => fileEntry.createWriter(resolve, reject));
            console.log(writer);
            set_streamFileWriter(queryArgs, writer);

            // add file to streamFileList
            const files = _streamFileList();
            if (files) {
              files.push(fileEntry);
              set__streamFileList(files);
            }

            return fileEntry;
          },

          /**
           * Write a new blob to file
           */
          streamFileWrite({ fileId, blobEvent },
            { currentSegmentId },
            { },
            { writeStreamSegmentBlob }
          ) {
            const segmentIndex = currentSegmentId({ fileId });
            const streamFileSegmentArgs = { fileId, segmentIndex, blobEvent };
            return writeStreamSegmentBlob(streamFileSegmentArgs);
          }
        },


        children: {
          streamFileWriter: 'streamFileWriter',
          
          _streamFileStat: 'streamFileStat',
          streamFileStat: {
            path: 'streamFileStat',
            reader(val, queryArgs) {
              
            }
          },
          streamFileUrl: {
            path: 'streamFileUrl',
            reader(val, queryArgs, { }, { }, { set_streamFileUrl }) {
              if (val) return val;

              // make sure we don't write more than once
              if (val === '') return NOT_LOADED;
              set_streamFileUrl(queryArgs, '');

              // fetch + cache url
              const path = getFilePath(queryArgs.fileId);
              fs.getUrl(path).then(url =>
                set_streamFileUrl(queryArgs, url)
              );
              return NOT_LOADED;
            }
          },
          // streamFileEntry: {
          //   path: 'streamFileEntry',
          //   async reader(val, queryArgs, { }, { set_streamFileEntry, _streamFileOpen }) {
          //     if (val) return val;
          //     // load when not loaded yet
          //     const file = await _streamFileOpen(queryArgs);
          //     set_streamFileEntry(file);
          //     return NOT_LOADED;
          //   }
          // },
          streamFileSegments: {
            path: 'segments',
            children: {
              streamFileSegment: {
                path: '$(segmentIndex)',
                readers: {
                  streamFileSegmentDuration(
                    streamFileSegmentArgs,
                    { streamFileSegmentStartTime, streamFileSegmentEndTime }
                  ) {
                    const start = streamFileSegmentStartTime(streamFileSegmentArgs);
                    const end = streamFileSegmentEndTime(streamFileSegmentArgs);
                    return end - start;
                  }
                },
                writers: {
                  writeStreamSegmentBlob(streamFileSegmentArgs,
                    { streamFileWriter, get_streamFileSegmentBlobCount, get_streamFileSegmentSize },
                    { },
                    { set_streamFileSegmentStartTime, set_streamFileSegmentEndTime,
                      set_streamFileSegmentBlobCount, set_streamFileSegmentSize,
                      set_streamFileUrl
                    }
                  ) {
                    // store blob in file
                    const { blobEvent, fileId } = streamFileSegmentArgs;
                    //const path = getFilePath(fileId);
                    //fs.appendFile(path, blobEvent.data);
                    const writer = streamFileWriter(streamFileSegmentArgs);
                    const writeResultPromise = writer.write(blobEvent.data);

                    // adding a blob (to the end), always adds one to blob count, and always updates the new "end time".
                    const blobCount = get_streamFileSegmentBlobCount(streamFileSegmentArgs);
                    const size = get_streamFileSegmentSize(streamFileSegmentArgs);
                    const path = getFilePath(fileId);
                    const end = blobEvent.timecode || 0;
                    const promises = [
                      writeResultPromise,
                      set_streamFileSegmentEndTime(streamFileSegmentArgs, end),
                      set_streamFileSegmentBlobCount(streamFileSegmentArgs, blobCount + 1),
                      set_streamFileSegmentSize(streamFileSegmentArgs, size + blobEvent.data.size),
                      fs.getUrl(path).then(url =>
                        set_streamFileUrl(streamFileSegmentArgs, url)
                      )
                    ];

                    if (blobCount === 0) {
                      // first blob
                      const start = blobEvent.timecode || 0;
                      promises.push(set_streamFileSegmentStartTime(streamFileSegmentArgs, start));
                    }
                    return Promise.all(promises);
                  },
                },
                children: {
                  streamFileSegmentStartTime: {
                    path: 'startTime',
                    reader(val) {
                      return val || 0;
                    }
                  },
                  streamFileSegmentEndTime: {
                    path: 'endTime',
                    reader(val) {
                      return val || 0;
                    }
                  },
                  streamFileSegmentBlobCount: {
                    path: 'blobCount',
                    reader(val) {
                      return val || 0;
                    }
                  },
                  streamFileSegmentSize: {
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
  }
};







          // buildStreamFileObjectFromBlobs(
          //   streamArgs,
          //   { get_streamFileSegments, streamRecorderMimeType },
          //   { }
          // ) {
          //   const allSegments = get_streamFileSegments(streamArgs);
          //   const mimeType = streamRecorderMimeType(streamArgs);
          //   const fileName = 'stream.webm';
          //   //const mimeType = get_streamRecorderObject(streamArgs).mimeType;
          //   const allBlobs = map(flatten(map(allSegments, 'blobs')), 'data');
          //   return new window.File(allBlobs, fileName, { type: mimeType });
          // },

          // buildStreamFileSuperBlob(
          //   streamArgs,
          //   { get_streamFileSegments },
          //   { }
          // ) {
          //   const allSegments = get_streamFileSegments(streamArgs);
          //   //const mimeType = get_streamRecorderObject(streamArgs).mimeType;
          //   const allBlobs = map(flatten(map(allSegments, 'blobs')), 'data');
          //   return new Blob(allBlobs);
          // }
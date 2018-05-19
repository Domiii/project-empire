import map from 'lodash/map';
import flatten from 'lodash/flatten';
import reduce from 'lodash/reduce';
import some from 'lodash/some';
import sortBy from 'lodash/sortBy';
import isEqual from 'lodash/isEqual';
import zipObject from 'lodash/zipObject';

import { EmptyObject, EmptyArray } from '../../util';
import { NOT_LOADED } from '../../dbdi/react';

import fs from 'bro-fs';
import uuid from 'uuid/v1';


/* globals window */
const {
  Blob
} = window;


const FileDirName = '/streamFiles';
const MetaFileDirName = '/streamFiles.meta';
const DefaultFileSystemConfig = {
  type: window.PERSISTENT,
  bytes: 5 * 1024 * 1024 * 1024
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

async function writeBlob(fileArgs, blob, readers, writers) {
  //console.log('Q', blob);

  const { _blobQueue, get_streamFileWriter } = readers;
  const { _streamFileOpen, set__blobQueue } = writers;

  // make sure, the writer is being prepared before doing anything else!
  const writerPromise = _streamFileOpen(fileArgs);

  let blobs = _blobQueue(fileArgs);
  if (!!blobs) {
    // we are still writing -> add to queue
    blobs.push(blob);
    set__blobQueue(fileArgs, blobs);
  }
  else {
    // queue is empty -> write to stream
    set__blobQueue(fileArgs, []);

    const writer = await writerPromise;
    writeBlobNow(fileArgs, writer, blob, readers, writers);
  }
}

function writeBlobNow(fileArgs, writer, blob) {
  //console.warn('W', blob);

  // write to blob and refresh queue
  return writer.write(blob);
}

function pumpQueue(fileArgs, writer, readers, writers) {
  const { _blobQueue } = readers;
  const { set__blobQueue } = writers;
  const blobs = _blobQueue(fileArgs);
  //console.log('pumpQueue:', blobs);
  if (blobs && blobs.length) {
    // keep going!
    const blob = blobs.shift();
    set__blobQueue(fileArgs, blobs);

    writeBlobNow(fileArgs, writer, blob, readers, writers);
  }
  else {
    //console.warn('queue empty!', blobs);
    // we are done! (for now)
    set__blobQueue(fileArgs, null);
  }
}

async function prepareWriter(fileArgs, readers, writers) {
  const { _blobQueue } = readers;

  if (_blobQueue(fileArgs)) {
    // NOTE: initial preparation cannot wait, because that would lead to race conditions!
    // already started the process
    return;
  }

  const { set_streamFileWriter, set__blobQueue, initStreamFs, set_streamFileExists } = writers;

  // start new queue
  set__blobQueue(fileArgs, []);

  // make sure, FS is initialized
  await initStreamFs();

  // prepare writer
  const { fileId } = fileArgs;
  const path = getFilePath(fileId);
  await fs.writeFile(path, '');

  set_streamFileExists(fileArgs, NOT_LOADED); // notify anyone depending on file existence that things changed

  const fileEntry = await fs.getEntry(path);
  const writer = await new Promise((resolve, reject) =>
    fileEntry.createWriter(resolve, reject)
  );
  writer.onwriteend = (evt) => {
    pumpQueue(fileArgs, writer, readers, writers);
  };
  writer.onerror = (err) => {
    console.error('write failed: ' + (err.stack || err));
    // error => get rid of writer!
    set_streamFileWriter(fileArgs, null);
  };

  // we are done initializing -> pump once!
  pumpQueue(fileArgs, writer, readers, writers);

  set_streamFileWriter(fileArgs, writer);
  return writer;
}

// (async() => {
//   await fs.init({ type: window.TEMPORARY, bytes: 5 * 1024 * 1024 });
//   // await fs.mkdir('dir');
//   // await fs.writeFile('dir/file.txt', 'hello world');
//   // const content = await fs.readFile('dir/file.txt');
//   console.log(await fs.readdir('dir', { deep: true })); // => "hello world"
// })();


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
        //const fileArgs = { fileId };
        //await _streamFileOpen(fileArgs);
        return fileId;
      }
    },
    children: {
      streamFsStatus: 'streamFsStatus',
      streamFileDirectory: {
        path: 'streamFileDirectory',
        readers: {
          orderedStreamFileList(
            { },
            { streamFileList, streamFileLastModified }
          ) {
            let files = streamFileList();
            if (!files) {
              return files;
            }

            const fileNames = map(files, 'name');
            const fileTimes = map(files, f => streamFileLastModified({ fileId: f.name }));
            if (some(fileTimes, t => t === NOT_LOADED)) {
              // not fully loaded yet
              return NOT_LOADED;
            }

            const timesById = zipObject(fileNames, fileTimes);
            const orderedFiles = sortBy(files, f => -timesById[f.name]);
            return orderedFiles;
          },
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
          async fetchStreamFile({ fileId }) {
            // we need this separate from the streamFileEntry for now, because we don't have proper event handling
            const path = getFilePath(fileId);
            const entry = await fs.getEntry(path);
            return await new Promise((resolve, reject) => entry.file(resolve, reject));
          },

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
            { get__streamFileMetadata,
              get_streamFileSegments, streamFileSegmentSize },
            { },
            { set__streamFileMetadata }
          ) {
            const { fileId } = streamFileArgs;
            // TODO: this only works while recording and data won't be available later
            // the total size of the stream, across all segments
            const segments = get_streamFileSegments(streamFileArgs);
            if (segments) {
              return reduce(segments, (sum, segment, segmentIndex) =>
                sum + streamFileSegmentSize(Object.assign({}, streamFileArgs, { segmentIndex })),
                0);
            }
            else if (!fileId) {
              return 0;
            }
            else {
              const path = getFilePath(fileId);
              (async () => {
                // fugly stuff -> gotta do something differently here
                if (await fs.exists(path)) {
                  const metadata = await fs.stat(path);
                  const { size } = metadata;
                  if (!isEqual(metadata, get__streamFileMetadata(streamFileArgs))) {
                    set__streamFileMetadata(streamFileArgs, metadata);
                  }
                }
              })();
              return (get__streamFileMetadata(streamFileArgs) || EmptyObject).size || 0;
            }
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
            readers,
            { },
            writers
          ) {
            // create and/or open file
            // see: https://github.com/vitalets/bro-fs/tree/master/src/index.js#L237
            const { _streamFileList, get_streamFileWriter } = readers;

            const { fileId } = queryArgs;
            let writer = get_streamFileWriter(queryArgs);
            if (!writer) {
              writer = await prepareWriter(queryArgs, readers, writers);

              const files = _streamFileList();
              if (files && !some(files, { name: fileId })) {
                const { set__streamFileList, set_streamFileUrl } = writers;

                // add file to streamFileList
                const path = getFilePath(fileId);
                const fileEntry = await fs.getEntry(path);
                files.push(fileEntry);
                set__streamFileList(files);

                // // set URL
                // fs.getUrl(path).then(url =>
                //   set_streamFileUrl(queryArgs, url)
                // );
              }
            }

            return writer;
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
          _blobQueue: '_blobQueue',
          _streamFileMetadata: '_metadata',

          // streamFileStat: {
          //   path: 'streamFileStat',
          //   async fetch(val, queryArgs) {
          //     // TODO: want to re-fetch as often as possible to make this accurate?!
          //     const { fileId } = queryArgs;
          //     const path = getFilePath(fileId);
          //     return await fs.stat(path);
          //   }
          // },
          streamFileExists: {
            path: 'exists',
            async fetch({ fileId }, { }, { }, { initStreamFs }) {
              await initStreamFs();
              const path = getFilePath(fileId);
              return await fs.exists(path);
            }
          },
          streamFileEntry: {
            path: 'entry',
            async fetch({ fileId }, { }, { }, { initStreamFs }) {
              await initStreamFs();
              const path = getFilePath(fileId);
              return await fs.getEntry(path);
            }
          },
          streamFileLastModified: {
            path: 'lastModified',
            async fetch(
              { fileId },
              { },
              { },
              { initStreamFs }
            ) {
              await initStreamFs();
              const path = getFilePath(fileId);
              const stats = await fs.stat(path);

              return stats.modificationTime.getTime();
            }
          },
          streamFileUrl: {
            path: 'url',
            async fetch({ fileId }, { }, { }, { initStreamFs }) {
              await initStreamFs();
              const path = getFilePath(fileId);
              return await fs.getUrl(path);
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
                  async writeStreamSegmentBlob(streamFileSegmentArgs,
                    readers,
                    { },
                    writers
                  ) {
                    // store blob in file
                    const { blobEvent, fileId } = streamFileSegmentArgs;
                    const {
                      get_streamFileSegmentBlobCount,
                      get_streamFileSegmentSize
                    } = readers;
                    const { set_streamFileSegmentStartTime, set_streamFileSegmentEndTime,
                      set_streamFileSegmentBlobCount, set_streamFileSegmentSize,
                    } = writers;
                    //const path = getFilePath(fileId);
                    //fs.appendFile(path, blobEvent.data);
                    //const writer = await streamFileWriter(streamFileSegmentArgs);

                    const fileArgs = { fileId };
                    writeBlob(fileArgs, blobEvent.data, readers, writers);

                    // TODO: segment data should be updated *AFTER* blob write has succeeded (not now)
                    // (segmentId being determined at time of queueing seems to be the right way of doing it)

                    // adding a blob (to the end), always adds one to blob count, and always updates the new "end time".
                    const blobCount = get_streamFileSegmentBlobCount(streamFileSegmentArgs);
                    const size = get_streamFileSegmentSize(streamFileSegmentArgs);
                    const end = blobEvent.timecode || 0;
                    const promises = [
                      set_streamFileSegmentEndTime(streamFileSegmentArgs, end),
                      set_streamFileSegmentBlobCount(streamFileSegmentArgs, blobCount + 1),
                      set_streamFileSegmentSize(streamFileSegmentArgs, size + blobEvent.data.size)
                    ];

                    if (blobCount === 0) {
                      // first blob
                      const start = blobEvent.timecode || 0;
                      promises.push(set_streamFileSegmentStartTime(streamFileSegmentArgs, start));
                    }
                    //return Promise.all(promises);
                    //return writeResultPromise;
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
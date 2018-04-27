import map from 'lodash/map';
import flatten from 'lodash/flatten';
import isArray from 'lodash/isArray';

import gapi from 'resources/gapi.js';

import getFirebaseConfig from 'src/config/firebase.cfg';
const firebaseConfig = getFirebaseConfig();


export const GapiStatus = {
  None: 0,
  Initializing: 1,
  Initialized: 2,
  Authorizing: 3,
  PopupBlocked: 4,
  NeedUserConsent: 5,
  Authorized: 6
};

// see: https://developers.google.com/api-client-library/javascript/reference/referencedocs
// see: https://github.com/youtube/api-samples/tree/master/javascript

// 1) auth: https://github.com/youtube/api-samples/blob/master/javascript/auth.js
// 2) upload: https://developers.google.com/youtube/v3/code_samples/javascript#do_resumable_uploads_with_cors

const MaxVideosPerQuery = 30;
const apiKey = firebaseConfig.apiKey;
const clientId = '861084752540-4o6v20knbkc8bbmdmdarjffqlsb5smdv.apps.googleusercontent.com';
const OAUTH2_SCOPES = [
  'https://www.googleapis.com/auth/youtube.force-ssl',
  'https://www.googleapis.com/auth/youtube.upload'
];

const DEBUGG = true;

/**
 * ######################################################
 * YouTube API Core
 * ######################################################
 */

const ContentTypes = {
  videoList: 'video',
  channelList: 'channelList',

  playlist: 'playlist'
};
const ContentRequestFunctions = {
  get videoList() { 
    return gapi.client.youtube.videos.list.bind(gapi.client.youtube.videos);
    },
  get channelList() {
    return gapi.client.youtube.channels.list.bind(gapi.client.youtube.channels);
  },
  
  // TODO: how to get playlists?
  // get playlist() { 
  //   return gapi.client.youtube.channels.list.bind(gapi.client.youtube.channels);
  // }
};

export function gapiInit() {
  return new Promise((resolve, reject) => {
    // see https://github.com/youtube/api-samples/blob/47c49fed14859957ed74fd2706259935937eb885/javascript/quickstart.html#L33
    return gapi.load('client:auth2', {
      callback: function () {
        // Handle gapi.client initialization.
        resolve(_gapiInit());
      },
      onerror: function (err) {
        reject(new Error('gapi.client failed to load - ' + (err.stack || JSON.stringify(err))));
      },
      timeout: 5000, // 5 seconds.
      ontimeout: function () {
        // Handle timeout.
        reject(new Error('gapi.client timeout'));
      }
    });
  });
}

async function _gapiInit() {
  var discoveryDocs = ['https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest'];

  return await gapi.client.init({
    apiKey,
    clientId,
    discoveryDocs,
    scope: 'https://www.googleapis.com/auth/youtube.readonly'
  });
}

/**
 * @see https://developers.google.com/youtube/v3/guides/auth/client-side-web-apps
 */
export async function gapiAuth(immediate, prompt = 'none') {
  // auth!
  return await new Promise((resolve, reject) => {
    gapi.auth.authorize({
      client_id: clientId,
      scope: OAUTH2_SCOPES,
      immediate: immediate,
      prompt
    }, function(response) {
      if (response.error) {
        // An error happened!
        return reject(response);
      }
      // The user authorized the application for the scopes requested.
      // You can also now use gapi.client to perform authenticated requests.
      resolve(response);
    });
  });
}

/**
 * @see https://developers.google.com/youtube/v3/guides/auth/client-side-web-apps#incrementalAuth
 */
export async function gapiGrantScopes(newScopes) {
  const user = gapi.auth2.getAuthInstance().currentUser.get();
  user.grant({'scope': newScopes});
}

function prepareRequest(contentType, requestArgs) {
  const fn = ContentRequestFunctions[contentType];
  console.assert(fn, 'invalid request type: ' + contentType);
  console.info('[YT Request]', contentType, requestArgs);
  return fn;
}

export function sendYtRequest(contentType, requestArgs) {
  const fn = prepareRequest(contentType, requestArgs);

  // TODO: make sure, we don't accidentally spam requests?

  return fn(requestArgs);
}

/**
 * Autmoatically batch the request.
 * Handles any arbitrary amount of ids by batching requests so as to respect the API limits.
 * @see https://stackoverflow.com/questions/36370821/does-youtube-v3-data-api-have-a-limit-to-the-number-of-ids-you-can-send-to-vide 
 */
export function sendYtRequestBatched(contentType, ids, part, maxResourcesPerQuery) {
  if (!isArray(ids)) {
    throw new Error('expected array of ids, not a string');
  }
  const nChunks = Math.ceil(ids.length / maxResourcesPerQuery);
  const allRequestArgs = [];
  for (let iChunk = 0; iChunk < nChunks; ++iChunk) {
    const iStart = iChunk * maxResourcesPerQuery;
    const iEnd = Math.min((iChunk + 1) * maxResourcesPerQuery, ids.length);
    const chunkIds = ids.slice(iStart, iEnd);
    const requestArgs = {
      id: chunkIds.join(','),
      part
    };
    allRequestArgs.push(requestArgs);
  }

  const requests = map(allRequestArgs, req => prepareRequest(contentType, req));

  return Promise.all(map(requests, request =>
    new Promise((resolve, reject) => {
      request.execute(response => {
        if (response.error) {
          console.error(`fetching "${contentType}" data failed for: `, allRequestArgs, '\n\n', response.error);
          reject(response.error);
        }
        else {
          const res = response.result;
          const items = res && res.items || [];

          resolve(
            items
          );
        }
      });
    })
  ))
    .then(allResults => ({
      type: ContentTypes[contentType],
      items: flatten(allResults)
    }));
}


/**
 * ######################################################
 * Higher level API
 * ######################################################
 */

export function ytFetchChannelData(ids) {
  return sendYtRequestBatched('channelList', ids, 'snippet,statistics', MaxVideosPerQuery);
}


export function ytFetchPlaylistData(ids) {
  return sendYtRequestBatched('playlist', ids, 'snippet,contentDetails', MaxVideosPerQuery);
}


export function ytFetchVideoData(ids) {
  // get basic video info
  // see: https://developers.google.com/youtube/v3/docs/videos
  // see: https://developers.google.com/apis-explorer/?hl=en_US#p/youtube/v3/youtube.videos.list?part=snippet&id=0QB9JP2l6tM%252C+9oGfI4o6Xfs&_h=4&
  return sendYtRequestBatched('videoList', ids, 'snippet,statistics', MaxVideosPerQuery);
}

// TODO: Uploading
// see: https://developers.google.com/youtube/v3/docs/videos/insert
// see: https://github.com/youtube/api-samples/tree/master/javascript/cors_upload.js
// see: https://github.com/youtube/api-samples/tree/master/javascript/upload_video.js
// see: https://developers.google.com/youtube/v3/code_samples/javascript#do_resumable_uploads_with_cors

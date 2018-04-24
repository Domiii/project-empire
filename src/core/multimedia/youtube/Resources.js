/**
 * Tools to easily fetch all kinds of YouTube resource metadata, such as: videos, playlists, channels
 * Also provides tools for extracting YouTube resource information from URLs, 
 * as well as building urls from resource metadata.
 */

import map from 'lodash/map';
import fromPairs from 'lodash/fromPairs';
import isEmpty from 'lodash/isEmpty';

import {
  ytFetchChannelData,
  ytFetchPlaylistData,
  ytFetchVideoData
} from './YouTubeApi';

export const ytResourceConfig = {
  // https://gist.github.com/Glurt/ea11b690ba4b1278e049
  // https://stackoverflow.com/questions/7693218/youtube-i-d-parsing-for-new-url-formats
  re: new RegExp([
    /(?:https?:\/\/|\/\/)?/, // Optional URL scheme. Either http, or https, or protocol-relative.
    /(?:www\.|m\.)?/, //  Optional www or m subdomain.
    /(?:youtu\.be\/|youtube\.com\/)/, // domain
    /(?:(?:embed\/|v\/|watch\?v=|watch\?.+&v=)([^&$\s]{11}))?/, // video id
    /(?:user\/([^\/]+))?/, // user name
    /[^\s]*/ // anything else
  ].map(exp => exp.source).join(''), 'gm'),
  buildQueryFromURL: ytBuildQueryFromUrl,
  getResourcesFromQuery: ytGetResourcesFromQuery
};

// Youtube stuff
export const resourceConfigs = {
  youtubeVideo: ytResourceConfig
};
 
  
export function getResourceType(resource) {
  return resource._resourceType;
}

export function buildResourceListQuery(text) {
  const results = {};
  for (let parserName in resourceConfigs) {
    const parser = resourceConfigs[parserName];
    let match;
    const matches = results[parserName] = [];
    while ((match = parser.re.exec(text))) {
      matches.push(parser.buildQueryFromURL(match));
    }
  }
  return results;
}

/**
 * @param {*} query A loosely formatted string containing an arbitrary amount of ids and/or (partial) urls of youtube resources, such as: (partial) urls, or ids of videos, playlists, channels
 */
export function executeResourceQuery(query, addResources) {
  if (!isEmpty(query)) {
    const promises = [];
    for (let resourceType in query) {
      const queryData = query[resourceType];
      const fetcher = resourceConfigs[resourceType];
      if (!fetcher || !fetcher.getResourcesFromQuery) {
        console.error('invalid query type: ' + resourceType);
        continue;
      }
      
      const promise = fetcher.getResourcesFromQuery(queryData)
        .then(result => {
          result._resourceType = resourceType;
          addResources(result);
          return result;
        });
      promises.push(promise);
    }
    return Promise.all(promises);
  }
}


// TODO:
// Key word extraction (http://keywordextraction.net/term-extractor)


export function ytBuildQueryFromUrl(match) {
  const url = match[0];
  const id = match[1] || null;
  const channelId = match[2] || null;
  const params = new window.URLSearchParams(url);
  const listId = params.get('list');

  return {
    url,
    id,
    listId,
    channelId
  };
}


function arrayToObject(arr, propName) {
  return fromPairs(map(arr, d => [d[propName], d]));
}

function ytSimplifyResources({
resourceList,
  channelData,
  videoData,
  playlistData
}) {
  const channelsById = arrayToObject(channelData, 'id');
  const videosById = arrayToObject(videoData.items, 'id');
  const playlistsById = arrayToObject(playlistData.items, 'id');

  return resourceList.map(res => {
    const video = videosById[res.id];
    const playlist = playlistsById[res.listId];

    const channelId = res.channelId ||
      (playlist && playlist.snippet.channelId) ||
      (video && video.snippet.channelId);
    const channel = channelsById[channelId];

    return Object.assign({}, res, {
      video,
      playlist,
      channel
    });
  });
}

/**
 * @param resourceList An array of YouTube resource identifiers.
 * @returns A promise yielding one object per resource, containing it's metdata.
 */
export function ytGetResourcesFromQuery(resourceList) {
  const ids = resourceList.map(resourceInfo => resourceInfo.id);
  const listIds = resourceList.filter(ri => !!ri.listId).map(ri => ri.listId);
  const inputChannelIds = resourceList.filter(ri => !!ri.channelId).map(ri => ri.channelId);

  return Promise.all([
    ytFetchVideoData(ids),
    ytFetchPlaylistData(listIds)
  ]).then(allItemData => {
    const videoData = allItemData[0];
    const playlistData = allItemData[1];

    // get channel data for all resources that have it
    const allItems = allItemData.reduce((res, itemData) => res.concat(itemData.items), []);
    const channelIds = allItems.filter(res => !!res.snippet && !!res.snippet.channelId)
      .map(res => res.snippet.channelId);

    // add channel ids of all channels in inputData
    channelIds.push.apply(channelIds, inputChannelIds);

    return ytFetchChannelData(channelIds)
      .then(channelData => {
        return ytSimplifyResources({
          resourceList,
          channelData: channelData.items,
          videoData,
          playlistData
        });
      });
  });
}


/**
 * ######################################################
 * YouTube URL building
 * ######################################################
 */

export function ytGetVideoUrlFromId(id) {
  return 'https://www.youtube.com/watch?v=' + id;
}

export function ytGetChannelUrlFromId(id) {
  return 'https://www.youtube.com/channel/' + id;
}


export function ytGetSearchUrl(searchString) {
  return 'https://www.youtube.com/results?search_query=' + searchString;
}
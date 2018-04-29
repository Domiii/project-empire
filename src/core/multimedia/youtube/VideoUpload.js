

// // #########################################################################################
// //
// // https://github.com/youtube/api-samples/blob/master/javascript/upload_video.js
// //
// // #########################################################################################

// /*
// Copyright 2015 Google Inc. All Rights Reserved.

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//   http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
// */

// var signinCallback = function (result) {
//   if (result.access_token) {
//     var uploadVideo = new UploadVideo();
//     uploadVideo.ready(result.access_token);
//   }
// };

// var STATUS_POLLING_INTERVAL_MILLIS = 60 * 1000; // One minute.


// /**
//  * YouTube video uploader class
//  *
//  * @constructor
//  */
// var UploadVideo = function() {
//   /**
//    * The array of tags for the new YouTube video.
//    *
//    * @attribute tags
//    * @type Array.<string>
//    * @default ['google-cors-upload']
//    */
//   this.tags = ['youtube-cors-upload'];

//   /**
//    * The numeric YouTube
//    * [category id](https://developers.google.com/apis-explorer/#p/youtube/v3/youtube.videoCategories.list?part=snippet&regionCode=us).
//    *
//    * @attribute categoryId
//    * @type number
//    * @default 22
//    */
//   this.categoryId = 22;

//   /**
//    * The id of the new video.
//    *
//    * @attribute videoId
//    * @type string
//    * @default ''
//    */
//   this.videoId = '';

//   this.uploadStartTime = 0;
// };


// UploadVideo.prototype.ready = function(accessToken) {
//   this.accessToken = accessToken;
//   this.gapi = gapi;
//   this.authenticated = true;
//   this.gapi.client.request({
//     path: '/youtube/v3/channels',
//     params: {
//       part: 'snippet',
//       mine: true
//     },
//     callback: function(response) {
//       if (response.error) {
//         console.log(response.error.message);
//       } else {
//         $('#channel-name').text(response.items[0].snippet.title);
//         $('#channel-thumbnail').attr('src', response.items[0].snippet.thumbnails.default.url);

//         $('.pre-sign-in').hide();
//         $('.post-sign-in').show();
//       }
//     }.bind(this)
//   });
//   $('#button').on("click", this.handleUploadClicked.bind(this));
// };

// /**
//  * Uploads a video file to YouTube.
//  *
//  * @method uploadFile
//  * @param {object} file File object corresponding to the video to upload.
//  */
// UploadVideo.prototype.uploadFile = function(file) {
//   var metadata = {
//     snippet: {
//       title: $('#title').val(),
//       description: $('#description').text(),
//       tags: this.tags,
//       categoryId: this.categoryId
//     },
//     status: {
//       privacyStatus: $('#privacy-status option:selected').text()
//     }
//   };
//   var uploader = new MediaUploader({
//     baseUrl: 'https://www.googleapis.com/upload/youtube/v3/videos',
//     file: file,
//     token: this.accessToken,
//     metadata: metadata,
//     params: {
//       part: Object.keys(metadata).join(',')
//     },
//     onError: function(data) {
//       var message = data;
//       // Assuming the error is raised by the YouTube API, data will be
//       // a JSON string with error.message set. That may not be the
//       // only time onError will be raised, though.
//       try {
//         var errorResponse = JSON.parse(data);
//         message = errorResponse.error.message;
//       } finally {
//         alert(message);
//       }
//     }.bind(this),
//     onProgress: function(data) {
//       var currentTime = Date.now();
//       var bytesUploaded = data.loaded;
//       var totalBytes = data.total;
//       // The times are in millis, so we need to divide by 1000 to get seconds.
//       var bytesPerSecond = bytesUploaded / ((currentTime - this.uploadStartTime) / 1000);
//       var estimatedSecondsRemaining = (totalBytes - bytesUploaded) / bytesPerSecond;
//       var percentageComplete = (bytesUploaded * 100) / totalBytes;

//       $('#upload-progress').attr({
//         value: bytesUploaded,
//         max: totalBytes
//       });

//       $('#percent-transferred').text(percentageComplete);
//       $('#bytes-transferred').text(bytesUploaded);
//       $('#total-bytes').text(totalBytes);

//       $('.during-upload').show();
//     }.bind(this),
//     onComplete: function(data) {
//       var uploadResponse = JSON.parse(data);
//       this.videoId = uploadResponse.id;
//       $('#video-id').text(this.videoId);
//       $('.post-upload').show();
//       this.pollForVideoStatus();
//     }.bind(this)
//   });
//   // This won't correspond to the *exact* start of the upload, but it should be close enough.
//   this.uploadStartTime = Date.now();
//   uploader.upload();
// };

// UploadVideo.prototype.handleUploadClicked = function() {
//   $('#button').attr('disabled', true);
//   this.uploadFile($('#file').get(0).files[0]);
// };

// UploadVideo.prototype.pollForVideoStatus = function() {
//   this.gapi.client.request({
//     path: '/youtube/v3/videos',
//     params: {
//       part: 'status,player',
//       id: this.videoId
//     },
//     callback: function(response) {
//       if (response.error) {
//         // The status polling failed.
//         console.log(response.error.message);
//         setTimeout(this.pollForVideoStatus.bind(this), STATUS_POLLING_INTERVAL_MILLIS);
//       } else {
//         var uploadStatus = response.items[0].status.uploadStatus;
//         switch (uploadStatus) {
//           // This is a non-final status, so we need to poll again.
//           case 'uploaded':
//             $('#post-upload-status').append('<li>Upload status: ' + uploadStatus + '</li>');
//             setTimeout(this.pollForVideoStatus.bind(this), STATUS_POLLING_INTERVAL_MILLIS);
//             break;
//           // The video was successfully transcoded and is available.
//           case 'processed':
//             $('#player').append(response.items[0].player.embedHtml);
//             $('#post-upload-status').append('<li>Final status.</li>');
//             break;
//           // All other statuses indicate a permanent transcoding failure.
//           default:
//             $('#post-upload-status').append('<li>Transcoding failed.</li>');
//             break;
//         }
//       }
//     }.bind(this)
//   });
// };




// // #########################################################################################
// //
// // https://github.com/youtube/api-samples/blob/master/javascript/my_uploads.js
// //
// // #########################################################################################

// // Define some variables used to remember state.
// var playlistId, nextPageToken, prevPageToken;

// // After the API loads, call a function to get the uploads playlist ID.
// function handleAPILoaded() {
//   requestUserUploadsPlaylistId();
// }

// // Call the Data API to retrieve the playlist ID that uniquely identifies the
// // list of videos uploaded to the currently authenticated user's channel.
// function requestUserUploadsPlaylistId() {
//   // See https://developers.google.com/youtube/v3/docs/channels/list
//   var request = gapi.client.youtube.channels.list({
//     mine: true,
//     part: 'contentDetails'
//   });
//   request.execute(function(response) {
//     playlistId = response.result.items[0].contentDetails.relatedPlaylists.uploads;
//     requestVideoPlaylist(playlistId);
//   });
// }

// // Retrieve the list of videos in the specified playlist.
// function requestVideoPlaylist(playlistId, pageToken) {
//   $('#video-container').html('');
//   var requestOptions = {
//     playlistId: playlistId,
//     part: 'snippet',
//     maxResults: 10
//   };
//   if (pageToken) {
//     requestOptions.pageToken = pageToken;
//   }
//   var request = gapi.client.youtube.playlistItems.list(requestOptions);
//   request.execute(function(response) {
//     // Only show pagination buttons if there is a pagination token for the
//     // next or previous page of results.
//     nextPageToken = response.result.nextPageToken;
//     var nextVis = nextPageToken ? 'visible' : 'hidden';
//     $('#next-button').css('visibility', nextVis);
//     prevPageToken = response.result.prevPageToken
//     var prevVis = prevPageToken ? 'visible' : 'hidden';
//     $('#prev-button').css('visibility', prevVis);

//     var playlistItems = response.result.items;
//     if (playlistItems) {
//       $.each(playlistItems, function(index, item) {
//         displayResult(item.snippet);
//       });
//     } else {
//       $('#video-container').html('Sorry you have no uploaded videos');
//     }
//   });
// }

// // Create a listing for a video.
// function displayResult(videoSnippet) {
//   var title = videoSnippet.title;
//   var videoId = videoSnippet.resourceId.videoId;
//   $('#video-container').append('<p>' + title + ' - ' + videoId + '</p>');
// }

// // Retrieve the next page of videos in the playlist.
// function nextPage() {
//   requestVideoPlaylist(playlistId, nextPageToken);
// }

// // Retrieve the previous page of videos in the playlist.
// function previousPage() {
//   requestVideoPlaylist(playlistId, prevPageToken);
// }


// // #########################################################################################
// //
// // https://github.com/youtube/api-samples/blob/master/javascript/playlist_updates.js
// //
// // #########################################################################################

// // Define some variables used to remember state.
// var newPlaylistId, channelId;

// // After the API loads, call a function to enable the playlist creation form.
// function handleAPILoaded() {
//   enableForm();
// }

// // Enable the form for creating a playlist.
// function enableForm() {
//   $('#playlist-button').attr('disabled', false);
// }

// // Create a private playlist.
// function createPlaylist() {
//   var request = gapi.client.youtube.playlists.insert({
//     part: 'snippet,status',
//     resource: {
//       snippet: {
//         title: 'Test Playlist',
//         description: 'A private playlist created with the YouTube API'
//       },
//       status: {
//         privacyStatus: 'private'
//       }
//     }
//   });
//   request.execute(function(response) {
//     var result = response.result;
//     if (result) {
//       newPlaylistId = result.id;
//       $('#playlist-id').val(newPlaylistId);
//       $('#playlist-title').html(result.snippet.title);
//       $('#playlist-description').html(result.snippet.description);
//     } else {
//       $('#status').html('Could not create playlist');
//     }
//   });
// }

// // Add a video ID specified in the form to the playlist.
// function addVideoToPlaylist() {
//   addToPlaylist($('#video-id').val());
// }

// // Add a video to a playlist. The "startPos" and "endPos" values let you
// // start and stop the video at specific times when the video is played as
// // part of the playlist. However, these values are not set in this example.
// function addToPlaylist(id, startPos, endPos) {
//   var details = {
//     videoId: id,
//     kind: 'youtube#video'
//   }
//   if (startPos != undefined) {
//     details['startAt'] = startPos;
//   }
//   if (endPos != undefined) {
//     details['endAt'] = endPos;
//   }
//   var request = gapi.client.youtube.playlistItems.insert({
//     part: 'snippet',
//     resource: {
//       snippet: {
//         playlistId: newPlaylistId,
//         resourceId: details
//       }
//     }
//   });
//   request.execute(function(response) {
//     $('#status').html('<pre>' + JSON.stringify(response.result) + '</pre>');
//   });
// }
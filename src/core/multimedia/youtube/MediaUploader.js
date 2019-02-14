import isString from 'lodash/isString';
import isPlainObject from 'lodash/isPlainObject';

//import gapi from 'resources/gapi.js';

// #########################################################################################
//
// see: https://raw.githubusercontent.com/youtube/api-samples/master/javascript/cors_upload.js
//
// #########################################################################################

var DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v2/files/';


const STATUS_POLLING_INTERVAL_MILLIS = 5 * 1000;

/* global XMLHttpRequest */

/**
 * Helper for implementing retries with backoff. Initial retry
 * delay is 1 second, increasing by 2x (+jitter) for subsequent retries
 *
 * @constructor
 */
var RetryHandler = function () {
  this.interval = 1000; // Start at one second
  this.maxInterval = 60 * 1000; // Don't wait longer than a minute 
};

/**
 * Invoke the function after waiting
 *
 * @param {function} fn Function to invoke
 */
RetryHandler.prototype.retry = function (fn) {
  setTimeout(fn, this.interval);
  this.interval = this.nextInterval_();
};

/**
 * Reset the counter (e.g. after successful request.)
 */
RetryHandler.prototype.reset = function () {
  this.interval = 1000;
};

/**
 * Calculate the next wait time.
 * @return {number} Next wait interval, in milliseconds
 *
 * @private
 */
RetryHandler.prototype.nextInterval_ = function () {
  var interval = this.interval * 2 + this.getRandomInt_(0, 1000);
  return Math.min(interval, this.maxInterval);
};

/**
 * Get a random int in the range of min to max. Used to add jitter to wait times.
 *
 * @param {number} min Lower bounds
 * @param {number} max Upper bounds
 * @private
 */
RetryHandler.prototype.getRandomInt_ = function (min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
};


/**
 * Helper class for resumable uploads using XHR/CORS. Can upload any Blob-like item, whether
 * files or in-memory constructs.
 *
 * @example
 * var content = new Blob(["Hello world"], {"type": "text/plain"});
 * var uploader = new MediaUploader({
 *   file: content,
 *   token: accessToken,
 *   onUploadComplete: function(data) { ... }
 *   onError: function(data) { ... }
 * });
 * uploader.upload();
 *
 * @constructor
 * @param {object} options Hash of options
 * @param {string} options.token Access token
 * @param {blob} options.file Blob-like item to upload
 * @param {string} [options.fileId] ID of file if replacing
 * @param {object} [options.params] Additional query parameters
 * @param {string} [options.contentType] Content-type, if overriding the type of the blob.
 * @param {object} [options.metadata] File metadata
 * @param {function} [options.onStart] Callback for when (any) upload is starting
 * @param {function} [options.onProgress] Callback for status for the in-progress upload
 * @param {function} [options.onUploadComplete] Callback for when upload is complete
 * @param {function} [options.onProcessed] Callback for when processing is complete
 * @param {function} [options.onError] Callback if upload fails
 */
export default class MediaUploader {
  constructor(options) {
    var noop = function () { };
    this.file = options.file;
    this.contentType = options.contentType || this.file.type || 'application/octet-stream';
    this.metadata = options.metadata || {
      'title': this.file.name,
      'mimeType': this.contentType
    };
    this.token = options.token;
    this.onStart = options.onStart || noop;
    this.onProgress = options.onProgress || noop;
    this.onUploadComplete = options.onUploadComplete || noop;
    this.onProcessed = options.onProcessed || noop;
    this.onError = options.onError || noop;
    this.offset = options.offset || 0;
    this.chunkSize = options.chunkSize || 0;
    this.retryHandler = new RetryHandler();

    this.url = options.url;
    if (!this.url) {
      var params = options.params || {};
      params.uploadType = 'resumable';
      this.url = this.buildUrl_(options.fileId, params, options.baseUrl);
    }
    this.httpMethod = options.fileId ? 'PUT' : 'POST';
  }

  /**
   * Initiate the upload by sending only metadata.
   * The remote end should reply with the file's destination URL.
   * Once that URL is provided, starts sending file.
   */
  upload() {
    const xhr = this.xhr = new XMLHttpRequest();

    xhr.open(this.httpMethod, this.url, true);
    xhr.setRequestHeader('Authorization', 'Bearer ' + this.token);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('X-Upload-Content-Length', this.file.size);
    xhr.setRequestHeader('X-Upload-Content-Type', this.contentType);

    xhr.onload = (e) => {
      if (e.target.status < 400) {
        var url = e.target.getResponseHeader('Location');
        this.url = url;
        console.warn('Uploading video to', url);
        this.sendFile_();
      }
      else {
        this.onUploadError_(e);
      }
    };
    xhr.onerror = this.onUploadError_.bind(this);
    xhr.send(JSON.stringify(this.metadata));
  }

  /**
   * Send the actual file content.
   *
   * @private
   */
  sendFile_() {
    var content = this.file;
    var end = this.file.size;

    if (this.offset || this.chunkSize) {
      // Only bother to slice the file if we're either resuming or uploading in chunks
      if (this.chunkSize) {
        end = Math.min(this.offset + this.chunkSize, this.file.size);
      }
      content = content.slice(this.offset, end);
    }

    var xhr = new XMLHttpRequest();
    xhr.open('PUT', this.url, true);
    xhr.setRequestHeader('Content-Type', this.contentType);
    xhr.setRequestHeader('Content-Range', 'bytes ' + this.offset + '-' + (end - 1) + '/' + this.file.size);
    xhr.setRequestHeader('X-Upload-Content-Type', this.file.type);
    if (xhr.upload) {
      xhr.upload.addEventListener('progress', this.onProgress);
    }
    xhr.onload = this.onContentUploadSuccess_.bind(this);
    xhr.onerror = this.onContentUploadError_.bind(this);
    xhr.send(content);

    this.onStart();
  }

  /**
   * Query for the state of the file for resumption.
   *
   * @private
   */
  resume_() {
    const xhr = this.xhr = new XMLHttpRequest();
    xhr.open('PUT', this.url, true);
    xhr.setRequestHeader('Content-Range', 'bytes */' + this.file.size);
    xhr.setRequestHeader('X-Upload-Content-Type', this.file.type);
    if (xhr.upload) {
      xhr.upload.addEventListener('progress', this.onProgress);
    }
    xhr.onload = this.onContentUploadSuccess_.bind(this);
    xhr.onerror = this.onContentUploadError_.bind(this);
    xhr.send();

    this.onStart();
  }

  /**
   * Extract the last saved range if available in the request.
   *
   * @param {XMLHttpRequest} xhr Request object
   */
  extractRange_(xhr) {
    var range = xhr.getResponseHeader('Range');
    if (range) {
      this.offset = parseInt(range.match(/\d+/g).pop(), 10) + 1;
    }
  }

  /**
   * Handle successful responses for uploads. Depending on the context,
   * may continue with uploading the next chunk of the file or, if complete,
   * invokes the caller's callback.
   *
   * @private
   * @param {object} e XHR event
   */
  onContentUploadSuccess_(e) {
    if (e.target.status === 200 || e.target.status === 201) {
      // finished it all
      const uploadResponse = JSON.parse(e.target.response);
      const videoId = uploadResponse.id;
      this.onUploadComplete(videoId);

      // start polling video status
      this.videoId = videoId;
      this.pollVideoStatus_();
    }
    else if (e.target.status === 308) {
      // only finished a chunk
      this.extractRange_(e.target);
      this.retryHandler.reset();
      this.sendFile_();
    }
  }

  /**
   * Handles errors for uploads. Either retries or aborts depending
   * on the error.
   *
   * @private
   * @param {object} e XHR event
   */
  onContentUploadError_(e) {
    if (e.target.status && e.target.status < 500) {
      this.notifyHTTPError_(e);
    }
    else {
      this.retryHandler.retry(this.resume_.bind(this));
    }
  }

  /**
   * Handles errors for the initial request.
   *
   * @private
   * @param {object} e XHR event
   */
  onUploadError_(e) {
    this.notifyHTTPError_(e);
  }

  notifyHTTPError_(e) {
    let err = e.target.response;
    // Assuming the error is raised by the YouTube API, data will be
    // a JSON string with error.message set. That may not be the
    // only time onError will be raised, though.
    try {
      if (isString(err)) {
        const errorResponse = JSON.parse(err);
        err = errorResponse.error.message;
      }
    }
    finally {
      this.onError(err); // TODO - Retries for initial upload?
    }
  }

  /**
   * Construct a query string from a hash/object
   *
   * @private
   * @param {object} [params] Key/value pairs for query string
   * @return {string} query string
   */
  buildQuery_(params) {
    params = params || {};
    return Object.keys(params).map(function (key) {
      return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
    }).join('&');
  }

  /**
   * Build the upload URL
   *
   * @private
   * @param {string} [id] File ID if replacing
   * @param {object} [params] Query parameters
   * @return {string} URL
   */
  buildUrl_(id, params, baseUrl) {
    var url = baseUrl || DRIVE_UPLOAD_URL;
    if (id) {
      url += id;
    }
    var query = this.buildQuery_(params);
    if (query) {
      url += '?' + query;
    }
    return url;
  }

  pollVideoStatus_ = () => {
    //console.log('pollVideoStatus_ GO');
    const { videoId } = this;
    gapi.client.request({
      path: '/youtube/v3/videos',
      params: {
        part: 'status,player',
        id: videoId
      },
      callback: (response) => {
        if (response.error) {
          // The status polling failed.
          // TODO: raise error with listeners
          // TODO: instead have a more rigurous/persistent approach to showing correct video status
          console.error('polling video status failed', response.error.message);
          setTimeout(this.pollVideoStatus_, STATUS_POLLING_INTERVAL_MILLIS);
        }
        else {
          console.log('video upload status update:', response);
          if (!response.items || !response.items.length) {
            setTimeout(this.pollVideoStatus_, STATUS_POLLING_INTERVAL_MILLIS);
            return;
          }

          debugger;
          const res = response.items[0];
          const uploadStatus = res.status.uploadStatus;
          //console.log('pollVideoStatus_ RES', res);
          switch (uploadStatus) {
            // This is a non-final status, so we need to poll again.
            case 'uploaded':
              setTimeout(this.pollVideoStatus_, STATUS_POLLING_INTERVAL_MILLIS);
              break;
            // The video was successfully transcoded and is available.
            case 'processed':
              this.onProcessed(res);
              break;

            // All other statuses indicate some sort of failure
            case 'rejected':
              this.onError(res.status.rejectionReason || res);
              break;
            default:
              this.onError(res.status.failureReason || res.status || res);
              break;
          }
        }
      }
    });
  }
}

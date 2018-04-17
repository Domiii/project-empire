import React, { Component } from 'react';
import PropTypes from 'prop-types';
import dataBind from 'src/dbdi/react/dataBind';

import {
  Alert, Button, Jumbotron, Well, Panel
} from 'react-bootstrap';

import autoBind from 'react-autobind';
import {
  LinkContainer
} from 'react-router-bootstrap';

import ProjectList from 'src/views/components/projects/ProjectList';

/**
 * TODO:
 *    Create a more robust, more general many-to-many indexing system
 */

/**
 * TODO:
 *    TEST: Can we capture from external camera?
 *      "Currently, people who want to do Video Conferencing with 'non-webcam' cameras, (internal/USB HDMI capture cards) are forced to use Xsplit to setup their video source, then Skype or Zoom will 'see' Xsplit as an available webcam input."
 *    Build basic GUI for streaming + storing vids online
 *      Start/Pause/Resume/Finish/Cancel buttons, live player, title, users
 *      Preview playback controls
 *      Video duration
 *      List all input devices: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/enumerateDevices
 *          https://developer.mozilla.org/en-US/docs/Web/API/MediaDeviceInfo
 *      be able to select input device/s: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/enumerateDevices
 *      Picture-in-picture (be able to record projector output as well as the speaker)
 *      Be able to switch picture priority during streaming
 *    Use MediaRecorder to store the data locally: https://developer.mozilla.org/en-US/docs/Web/API/MediaStream_Recording_API
 *    Figure out possibilities of / set correct encoding
 *    Use YouTube API to upload directly to YT
 *    Associate video with students and projects + vice versa
 *    Set YT vid title, tags, privacy
 *    Allow editing of title, tags, privacy
 *    List all videos per student or per project
 *    Video duration controller? (e.g. max 1.5min etc...)
 *    Try to cache the video data while streaming / try failsaving streaming process
 *      Track stream/cache size via Blob API https://developer.mozilla.org/en-US/docs/Web/API/Blob
 *    Track+limit every user's quota - https://developers.google.com/youtube/v3/determine_quota_cost
 */

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
 */
function startVideo(videoEl) {
  // Prefer camera resolution nearest to 1280x720.
  // see: https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackConstraints
  var constraints = { 
    audio: {
      //deviceId: audioDeviceId
    },
    video: {
      width: 1280, 
      height: 720,
      //deviceId: videoDeviceId
    }
  };

  window.navigator.mediaDevices.getUserMedia(constraints)
    .then(function(mediaStream) {
      videoEl.srcObject = mediaStream;
      videoEl.onloadedmetadata = function(e) {
        videoEl.play();
      };
    })
    .catch(function(err) { 
      console.log(err.name + ': ' + err.stack);
    }); // always check for errors at the end.
}

export class VideoRecorder extends Component {
  videoReady = (videoEl) => {
    startVideo(videoEl);
  }

  render() {
    return (<div>
      <video ref={this.videoReady} />
    </div>);
  }
}

export default class VideoRecordingPage extends Component {
  static propTypes = {
    projectIds: PropTypes.object
  };

  constructor(...args) {
    super(...args);

    autoBind(this);
  }

  render() {
    //{ this.IsGuardian && this.makeGuardianEl() }
    return (
      <div>
        <VideoRecorder />
      </div>
    );
  }
}
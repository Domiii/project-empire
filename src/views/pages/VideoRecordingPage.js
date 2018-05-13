import React, { Component } from 'react';
import PropTypes from 'prop-types';
import dataBind from 'src/dbdi/react/dataBind';

import {
  Alert, Button, Jumbotron, Well, Panel
} from 'react-bootstrap';

import {
  LinkContainer
} from 'react-router-bootstrap';

import MediaStreamPanel from 'src/views/components/multimedia/MediaStreamPanel';
import StreamFileList from 'src/views/components/multimedia/StreamFileList';


/**
 * TODO:
 *    Create a more robust, more general many-to-many indexing system
 */

/**
 * TODO:
 *    Build basic GUI for streaming + storing vids online
 *      Start/Pause/Resume/Finish/Cancel buttons, live player, title, users
 *      Preview playback controls
 *      Video duration
 *      List all input devices: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/enumerateDevices
 *          https://developer.mozilla.org/en-US/docs/Web/API/MediaDeviceInfo
 *      be able to select input device/s
 *      Be able to switch picture priority during streaming
 *    Use MediaRecorder to store the data locally: https://developer.mozilla.org/en-US/docs/Web/API/MediaStream_Recording_API
 *    Figure out possibilities of / set correct encoding
 *    Associate video with students and projects + vice versa
 
 *    Volume indicator: 
 *        https://github.com/webrtc/samples/blob/gh-pages/src/content/getusermedia/volume/js/soundmeter.js
 *        https://github.com/cwilso/volume-meter/blob/master/volume-meter.js
 *    TEST: Can we capture from external camera?
 *      "Currently, people who want to do Video Conferencing with 'non-webcam' cameras, (internal/USB HDMI capture cards) are forced to use Xsplit to setup their video source, then Skype or Zoom will 'see' Xsplit as an available webcam input."
 *    Use YouTube API to upload directly to YT
 *    Set YT vid title, tags, privacy
 *    Allow editing of title, tags, privacy
 *    List all videos per student or per project
 *    Video duration controller? (e.g. max 1.5min etc...)
 *    Try to cache the video data while streaming / try failsaving streaming process
 *      Track stream/cache size via Blob API https://developer.mozilla.org/en-US/docs/Web/API/Blob
 *      Use IndexedDB API to cache permanently: https://github.com/muaz-khan/RecordRTC/blob/master/dev/DiskStorage.js
 *        https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
 *    Track+limit every user's quota - https://developers.google.com/youtube/v3/determine_quota_cost
 *    Screen recording (be able to record projector output as well as the speaker) - https://github.com/muaz-khan/RecordRTC/blob/master/simple-demos/video-plus-screen-recording.html
 */

const streamContext = {
  streamArgs: {
    streamId: 1
  }
};

export default class VideoRecordingPage extends Component {
  static propTypes = {
    projectIds: PropTypes.object
  };

  constructor(...args) {
    super(...args);
  }

  render() {
    //{ this.IsGuardian && this.makeGuardianEl() }
    return (
      <div className="container">
        <MediaStreamPanel streamArgs={streamContext.streamArgs} />
        <br />
        <br />
        <StreamFileList />
      </div>
    );
  }
}
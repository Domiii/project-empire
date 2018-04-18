import React, { Component } from 'react';
import PropTypes from 'prop-types';
import dataBind from 'src/dbdi/react/dataBind';

import {
  Alert, Button, Jumbotron, Well, Panel
} from 'react-bootstrap';

import {
  getDeviceList
} from 'src/util/mediaUtil';
import { Z_DEFAULT_COMPRESSION } from 'zlib';
import { MediaStatus } from '../../../core/multimedia/StreamModel';

const hasGetUserMedia = !!(navigator.getUserMedia || navigator.webkitGetUserMedia ||
  navigator.mozGetUserMedia || navigator.msGetUserMedia);

function log(...args) {
  console.log(...args);
}

/**
 * ############################################################
 * select video streams
 * ############################################################
 */

// Prefer camera resolution nearest to 1280x720.
// see: https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackConstraints
const defaultConstraints = {
  audio: {
    //deviceId: audioDeviceId
  },
  video: {
    width: 1280,
    height: 720,
    //deviceId: videoDeviceId
  }
};




/**
 * ############################################################
 * startVideo
 * ############################################################
 */

function getStream(constraints) {
  return window.navigator.mediaDevices.getUserMedia(constraints)
    .then(mediaStream => {
      return mediaStream;
    })
    .catch(err => {
      console.log('Could not get stream: ' + err.stack);
    }); // always check for errors at the end.
}


/**
 * ############################################################
 * Basic media utils
 * ############################################################
 */

// src: window.URL.createObjectURL(stream)

/**
 * ############################################################
 * MediaStreamPanel
 * ############################################################
 */

@dataBind({})
export default class MediaStreamPanel extends Component {
  constructor(...args) {
    super(...args);

    this.dataBindMethods(
      //'componentDidMount',
      'onVideoDOMReady'
    );
  }

  // componentDidMount = (
  //   { },
  //   { },
  //   { }
  // ) => {
  // }

  onVideoDOMReady = (videoEl,
    { },
    { newStreamRecording },
    { }
  ) => {
    //getDeviceList().then(log);
    this.videoEl = videoEl;
    const newStreamArgs = {
      constraints: defaultConstraints
    };

    const streamId = newStreamRecording(newStreamArgs).then(
      this.startRecording
    );

    this.streamId = streamId;
    this.streamIdObj = { streamId };
  }

  /**
   * @see https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
   */
  startRecording = (
    streamId,
    { },
    { get_streamObject }
  ) => {
    this.streamId = streamId;
    const streamArgs = this.streamArgs = { streamId };
    const stream = get_streamObject(streamArgs);

    const videoEl = this.videoEl;

    videoEl.srcObject = stream;

    return Promise.all([
      new Promise((resolve, reject) => {
        videoEl.onloadedmetadata = e => {
          videoEl.play();
          resolve(e);
        };
        videoEl.onerror = err => {
          reject(err);
        };
      })
    ]);
  }

  _selfUpdate = () => {
    this.setState({});
  }

  continueSelfUpdate = () => {
    window.requestAnimationFrame(this._selfUpdate);
  }

  render(
    { },
    { get_streamStatus, get_streamSize }
  ) {
    if (!hasGetUserMedia) {
      return <Alert bsStyle="danger">Browser does not have media capture support</Alert>;
    }

    const status = this.streamArgs && get_streamStatus(this.streamArgs) || MediaStatus.NotReady;

    this.continueSelfUpdate();

    return (<div className="media-stream-panel">
      <div>
        <video controls className="media-panel-video"
          ref={this.onVideoDOMReady} />
      </div>
      <div>
        {status}
        <Button bsStyle="primary">Start/Pause/Resume</Button>
        <Button bsStyle="primary">Switch playback/live stream</Button>
      </div>
      <div>
        <input className="full-width" placeholder="TODO: title" />
      </div>
      <div>
        TODO: tags, users, privacy etc.
      </div>
      <div>
        <Button bsStyle="success" block>Upload!</Button>
      </div>
    </div>);
  }
}
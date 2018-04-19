import map from 'lodash/map';
import zipObject from 'lodash/zipObject';

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import dataBind from 'src/dbdi/react/dataBind';

import FAIcon from 'src/views/components/util/FAIcon';

import {
  Alert, Button, Jumbotron, Well, Panel
} from 'react-bootstrap';

import {
  getDeviceList
} from 'src/util/mediaUtil';
//import { Z_DEFAULT_COMPRESSION } from 'zlib';
import { MediaStatus } from '../../../core/multimedia/StreamModel';


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


const actionNames = [
  'startStreamRecorder',
  'pauseStreamRecorder',
  'resumeStreamRecorder'
];
const injectedActions = zipObject(
  map(actionNames, name => 'click_' + name), 
  map(actionNames, name => (
    clickEvt,
    { streamArgs },
    fns
  ) => {
    return fns[name](streamArgs);
  })
);
const RecorderCtrlButton = dataBind(injectedActions)(function RecorderCtrlButton(
  { streamArgs },
  fns,
) {
  let icon;
  let text;
  let action;

  const { get_streamStatus } = fns;

  const status = streamArgs && get_streamStatus(streamArgs);
  switch (status) {
    case MediaStatus.Ready:
      text = 'Start!';
      icon = 'play';
      action = fns.click_startStreamRecorder;
      break;
    case MediaStatus.Running:
      text = 'Pause';
      icon = 'pause';
      action = fns.click_pauseStreamRecorder;
      break;
    case MediaStatus.Paused:
      text = 'Resume';
      icon = 'play';
      action = fns.click_resumeStreamRecorder;
      break;
    case MediaStatus.Finished:
      text = 'Finished';
      icon = 'stop';
      break;
    case MediaStatus.NotReady:
    default:
      text = 'not ready';
      icon = 'play';
      break;
  }
  return (<Button disabled={!action} onClick={action}>
    <FAIcon name={icon} />{text}
  </Button>);
});

@dataBind({})
export default class MediaStreamPanel extends Component {
  constructor(...args) {
    super(...args);

    this.dataBindMethods(
      //'componentDidMount',
      'onVideoDOMReady',
      'startRecording'
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
    { startStreamRecording },
    { }
  ) => {
    //getDeviceList().then(log);
    this.videoEl = videoEl;
    const newStreamArgs = {
      constraints: defaultConstraints
    };

    const streamId = startStreamRecording(newStreamArgs).then(
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

    // force an update
    this.setState({});

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
    { streamStatus, streamSize },
    { isMediaRecorderCompatible }
  ) {
    if (!isMediaRecorderCompatible) {
      return <Alert bsStyle="danger">Browser does not have media capture support</Alert>;
    }

    const { streamArgs } = this;

    let infoEl;
    if (streamArgs) {
      const status = streamStatus(streamArgs);
      const size = streamSize(streamArgs);
      infoEl = (<span>
        Status: {status},  size: {size}
      </span>);
    }
    else {
      infoEl = <Alert bsStyle="warning">stream not ready yet</Alert>;
    }

    //this.continueSelfUpdate();

    return (<div className="media-stream-panel">
      <div>
        <video muted controls className="media-panel-video"
          ref={this.onVideoDOMReady} />
      </div>
      <div>
        {infoEl}
        <RecorderCtrlButton streamArgs={streamArgs} />
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
import map from 'lodash/map';
import zipObject from 'lodash/zipObject';

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import dataBind from 'src/dbdi/react/dataBind';

import FAIcon from 'src/views/components/util/FAIcon';

import {
  Alert, Button, Jumbotron, Well, Panel
} from 'react-bootstrap';

import Flexbox from 'flexbox-react';

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
 * RecorderCtrlButton
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
      text = 'Start recording!';
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
    case MediaStatus.Preparing:
    case MediaStatus.NotReady:
    default:
      text = 'not ready';
      icon = '';
      break;
  }
  return (<Button disabled={!action} onClick={action}>
    <FAIcon name={icon} />{text}
  </Button>);
});


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
      'onVideoDOMReady',
      'startRecording',
      'clickShutdown'
    );
  }

  // componentDidMount = (
  //   { },
  //   { },
  //   { }
  // ) => {
  // }

  onVideoDOMReady = (videoEl,
    { streamArgs },
    { },
    { }
  ) => {
    //getDeviceList().then(log);
    this.videoEl = videoEl;
  }

/**
 * ############################################################
 * startRecording
 * ############################################################
 */
  /**
   * @see https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
   */
  startRecording = (
    _ignoreFirstArg,
    { streamArgs },
    { get_streamObject, startStreamRecording }
  ) => {
    const {
      streamId
    } = streamArgs;

    const newStreamArgs = {
      constraints: defaultConstraints,
      streamId
    };

    return startStreamRecording(newStreamArgs).then(() => {
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
    });
  }

/**
 * ############################################################
 * clickShutdown
 * ############################################################
 */
  clickShutdown = (
    evt,
    { streamArgs },
    { stopStream }
  ) => {
    this.videoEl && this.videoEl.removeAttribute('controls');
    return stopStream(streamArgs);
  }

  _selfUpdate = () => {
    this.setState({});
  }

  continueSelfUpdate = () => {
    window.requestAnimationFrame(this._selfUpdate);
  }

/**
 * ############################################################
 * render
 * ############################################################
 */
  render(
    { streamArgs },
    { streamStatus, streamSize,
      streamObject, streamRecorderObject,
      isStreamActive },
    { isMediaRecorderCompatible }
  ) {
    if (!isMediaRecorderCompatible) {
      return <Alert bsStyle="danger">Browser does not have media capture support</Alert>;
    }

    const status = streamStatus(streamArgs);

    let controls;
    const isOffline = status <= MediaStatus.Preparing;
    if (isOffline) {
      controls = (<Button bsSize="large" bsStyle="success"
          onClick={this.startRecording} block>
        <FAIcon name="play-circle" /> Start!
      </Button>);
    }
    else {
      const streamObj = streamObject(streamArgs);
      const isActive = isStreamActive(streamArgs);

      let infoEl;
      if (!!streamObj) {
        const size = streamSize(streamArgs);
        const recorder = streamRecorderObject(streamArgs);
        const recorderState = recorder && recorder.state;
        infoEl = (<span>
          Status: {status} ({recorderState}),  size: {size}
        </span>);
      }
      else {
        infoEl = <Alert bsStyle="warning">stream not ready yet</Alert>;
      }

      controls = (<div>
        <div>
          {infoEl}
          <RecorderCtrlButton />
          <Button bsStyle="primary">Switch playback/live stream</Button>
        </div>
        <div>
          <input className="full-width" placeholder="TODO: title" />
        </div>
        <div>
          TODO: tags, users, privacy etc.
        </div>
        <div>
          <Flexbox justifyContent="space-between" alignItems="center">
            <Flexbox className="full-width">
              <Button bsStyle="success" block>Upload!</Button>
            </Flexbox>
            <Flexbox className="full-width">
              <Button bsStyle="danger" block
                disabled={!isActive} onClick={this.clickShutdown}>
                <FAIcon color="yellow" name="alert" /> Shutdown
              </Button>
            </Flexbox>
          </Flexbox>
        </div>
      </div>);
    }

    //this.continueSelfUpdate();

    const videoProps = {
      muted: true
    };

    if (!isOffline) {
      videoProps.controls = 1;
    }

    return (<div className="media-stream-panel">
      <div>
        <video {...videoProps} className="media-panel-video"
          ref={this.onVideoDOMReady} />
      </div>
      {controls}
    </div>);
  }
}
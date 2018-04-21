import map from 'lodash/map';
import zipObject from 'lodash/zipObject';
import moment from 'moment';

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import dataBind from 'src/dbdi/react/dataBind';

import filesize from 'filesize';

import FAIcon from 'src/views/components/util/FAIcon';

import MediaInputSelect from './MediaInputSelect';

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

const renderSize = filesize.partial({ base: 10 });

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
 * MediaSettingsPanel
 * ############################################################
 */
@dataBind({})
class MediaSettingsPanel extends Component {
  render() {
    const { disabled } = this.props;

    return (<div>
      <Flexbox alignItems="center" className="full-width">
        <Flexbox>
          <FAIcon name="video-camera" size="2em" className="width-2" />
        </Flexbox>
        <Flexbox className="full-width">
          <MediaInputSelect disabled={disabled} kind="videoinput" />
        </Flexbox>
      </Flexbox>
      <Flexbox alignItems="center" className="full-width">
        <Flexbox>
          <FAIcon name="microphone" size="2em" className="width-2" />
        </Flexbox>
        <Flexbox className="full-width">
          <MediaInputSelect disabled={disabled} kind="audioinput" />
        </Flexbox>
      </Flexbox>
    </div >);
  }
}



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
      '_attachStreamToLiveVideo',
      'activateStream',
      'clickShutdown',
      'renderOfflineView'
    );
  }

  // componentDidMount = (
  //   { },
  //   { },
  //   { }
  // ) => {
  // }

  /**
   * ############################################################
   * handle live video element
   * ############################################################
   */

  onLiveVideoDOMReady = (liveVideoEl) => {
    //getDeviceList().then(log);
    this.liveVideoEl = liveVideoEl;
    this._attachStreamToLiveVideo();
  }

  _attachStreamToLiveVideo = (
    { streamArgs },
    { get_streamObject }
  ) => {
    const stream = get_streamObject(streamArgs);

    const liveVideoEl = this.liveVideoEl;

    if (liveVideoEl) {
      liveVideoEl.srcObject = stream;

      // force an update
      this.setState({});

      return Promise.all([
        new Promise((resolve, reject) => {
          liveVideoEl.onloadedmetadata = e => {
            liveVideoEl.play();
            resolve(e);
          };
          liveVideoEl.onerror = err => {
            reject(err);
          };
        })
      ]);
    }
  }

  /**
   * ############################################################
   * activateStream
   * ############################################################
   */

  activateStream = (
    _ignoreFirstArg,
    { streamArgs },
    { startStreamRecording }
  ) => {
    const {
      streamId
    } = streamArgs;

    const newStreamArgs = {
      constraints: defaultConstraints,
      streamId
    };

    return startStreamRecording(newStreamArgs).then(this._attachStreamToLiveVideo);
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
    //this.liveVideoEl && this.liveVideoEl.removeAttribute('controls');
    return stopStream(streamArgs);
  }

  _selfUpdate = () => {
    this.setState({});
  }

  continueSelfUpdate = () => {
    window.requestAnimationFrame(this._selfUpdate);
  }

  renderOfflineView(
    { streamArgs },
    { streamStatus },
    { hasSelectedInputMedia }
  ) {
    const status = streamStatus(streamArgs);
    const isPreparing = status === MediaStatus.Preparing;
    const mediaReady = hasSelectedInputMedia;

    return (<div>
      <div>
        <MediaSettingsPanel />
      </div>
      <br />
      <Button bsSize="large" bsStyle="success"
        disabled={isPreparing || !mediaReady}
        onClick={this.activateStream} block>
        <FAIcon name="play-circle" /> Start!
          {isPreparing && <FAIcon name="cog" spinning />}
      </Button>
    </div>);
  }

  /**
   * ############################################################
   * render
   * ############################################################
   */
  render(
    { streamArgs },
    { streamStatus, streamSize,
      streamDuration,
      streamRecorderObject,
      isStreamActive, isStreamReady, isStreamOffline },
    { isMediaRecorderCompatible, videoDeviceId, audioDeviceId }
  ) {
    if (!isMediaRecorderCompatible) {
      return <Alert bsStyle="danger">Browser does not have media capture support</Alert>;
    }

    const status = streamStatus(streamArgs);

    let titleEl;
    let contentEl;
    let videoProps;
    const isOffline = isStreamOffline(streamArgs);
    const isRecording = status === MediaStatus.Running;
    if (isOffline) {
      titleEl = 'Setup Stream';
      contentEl = this.renderOfflineView();
    }
    else {
      titleEl = (<span>Record&nbsp;
        {videoDeviceId && <FAIcon color="green" name="video-camera" />}
        {audioDeviceId && <FAIcon color="green" name="microphone" />}&nbsp;
        <span>
          {isRecording && <FAIcon className="slow-blink" name="circle" color="red" />}
          {!isRecording && <FAIcon name="stop" color="gray" />}
        </span>
      </span>);

      //const streamObj = streamObject(streamArgs);
      const isReady = isStreamReady(streamArgs) || isStreamActive(streamArgs);
      const canUpload = size > 100;

      const duration = streamDuration(streamArgs);
      //const durationStr = 
      const size = streamSize(streamArgs);
      const recorder = streamRecorderObject(streamArgs);
      const recorderState = recorder && recorder.state;
      const infoEl = (<span>
        Status: {status} ({recorderState}),
        {/* Duration: {moment.duration(duration, 'milliseconds').format('h:m:s')}, */}
        <span className="media-size-label">{renderSize(size)}</span>
      </span>);

      videoProps = {
        //currentTime: duration/1000
      };

      if (this.liveVideoEl) {
        this.liveVideoEl.currentTime = duration / 1000;
      }

      if (!isOffline) {
        videoProps.controls = 1;
      }

      contentEl = (<div>
        <div>
          <RecorderCtrlButton />
          {infoEl}
        </div>
        {/* <div>
          <Button bsStyle="primary">Switch playback/live stream</Button>
        </div> */}
        <div>
          <input className="full-width" placeholder="TODO: title" />
        </div>
        <div>
          TODO: tags, users, privacy etc.
        </div>
        <div>
          <Flexbox justifyContent="space-between" alignItems="center">
            <Flexbox className="full-width">
              <Button bsStyle="success" disabled={!canUpload} block>
                <FAIcon color="" name="upload" />
                Upload!
              </Button>
            </Flexbox>
            <Flexbox className="full-width">
              <Button bsStyle="danger" block
                disabled={!isReady} onClick={this.clickShutdown}>
                <FAIcon color="yellow" name="exclamation-triangle" />
                Shutdown
              </Button>
            </Flexbox>
          </Flexbox>
        </div>
      </div>);
    }

    //this.continueSelfUpdate();

    return (<div className="media-stream-panel">
      <h2 className="inline-hcentered">
        {titleEl}
      </h2>
      <div>
        <video {...videoProps} muted className="media-panel-video"
          ref={this.onLiveVideoDOMReady} />
      </div>
      {contentEl}
    </div>);
  }
}
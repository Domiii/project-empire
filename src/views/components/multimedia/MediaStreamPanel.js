import map from 'lodash/map';
import zipObject from 'lodash/zipObject';
import flatten from 'lodash/flatten';

import moment from 'moment';

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import dataBind from 'src/dbdi/react/dataBind';

import filesize from 'filesize';
import FileSaver from 'file-saver';

import FAIcon from 'src/views/components/util/FAIcon';
import LoadIndicator from 'src/views/components/util/loading';

import {
  Alert, Button, Jumbotron, Well, Panel
} from 'react-bootstrap';

import Flexbox from 'flexbox-react';

//import { Z_DEFAULT_COMPRESSION } from 'zlib';
import { MediaStatus } from '../../../core/multimedia/StreamModel';

import MediaInputSelect from './MediaInputSelect';
import { fail } from 'assert';


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
  let bsStyle, bsSize;

  const { get_streamStatus } = fns;

  const status = streamArgs && get_streamStatus(streamArgs);
  switch (status) {
    case MediaStatus.Ready:
      text = 'Start recording!';
      icon = 'play';
      action = fns.click_startStreamRecorder;
      bsStyle = 'success';
      bsSize = 'large';
      break;
    case MediaStatus.Running:
      text = 'Pause';
      icon = 'pause';
      action = fns.click_pauseStreamRecorder;
      bsStyle = 'warning';
      break;
    case MediaStatus.Paused:
      text = 'Resume';
      icon = 'play';
      action = fns.click_resumeStreamRecorder;
      bsStyle = 'success';
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
  return (<Button disabled={!action} onClick={action} bsStyle={bsStyle} bsSize={bsSize}>
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
      'startNewStream',
      'clickFinish',
      'clickStartDownload',
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
            liveVideoEl.currentTime = 1;
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

  startNewStream = (
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

    return startStreamRecording(newStreamArgs).then(() => this._attachStreamToLiveVideo());
  }

  /**
   * ############################################################
   * click*
   * ############################################################
   */

  clickFinish = (evt,
    { streamArgs },
    { stopStreamRecorder }
  ) => {
    stopStreamRecorder(streamArgs);
  }

  clickStartDownload = (clickEvent,
    { streamArgs },
    { get_streamSegments, get_streamRecorderObject },
    { }
  ) => {
    const allSegments = get_streamSegments(streamArgs);
    const fileName = 'stream.webm';
    //const mimeType = get_streamRecorderObject(streamArgs).mimeType;
    const allBlobs = map(flatten(allSegments), 'data');
    var file = new window.File(allBlobs, fileName, { type: 'video/webm' });
    return FileSaver.saveAs(file);
  }

  /**
   * ############################################################
   * clickShutdown
   * ############################################################
   */
  clickShutdown = (
    evt,
    { streamArgs },
    { shutdownStream }
  ) => {
    //this.liveVideoEl && this.liveVideoEl.removeAttribute('controls');
    return shutdownStream(streamArgs);
  }

  /**
   * ############################################################
   * utilities
   * ############################################################
   */

  _selfUpdate = () => {
    this.setState({});
  }

  continueSelfUpdate = () => {
    window.requestAnimationFrame(this._selfUpdate);
  }


  /**
   * ############################################################
   * renderOfflineView
   * ############################################################
   */

  renderOfflineView(
    { streamArgs },
    { streamStatus },
    { hasSelectedInputMedia }
  ) {
    const status = streamStatus(streamArgs);
    const isPreparing = status === MediaStatus.Preparing;
    const mediaReady = hasSelectedInputMedia;

    if (isPreparing) {
      return (<LoadIndicator block size={2} message="activating devices..." />);
    }
    else {
      return (<div>
        <div>
          <MediaSettingsPanel />
        </div>
        <br />
        <Button bsSize="large" bsStyle="success"
          disabled={!mediaReady}
          onClick={this.startNewStream} block>
          <FAIcon name="play-circle" /> Start!
        </Button>
      </div>);
    }
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
      //const streamObj = streamObject(streamArgs);
      const hasStarted = isStreamActive(streamArgs);

      const duration = streamDuration(streamArgs);
      //const durationStr = 
      const size = streamSize(streamArgs);
      const recorder = streamRecorderObject(streamArgs);
      const canUpload = status === MediaStatus.Finished;

      titleEl = (<span>
        <span>
          {isRecording && <FAIcon className="slow-blink" name="circle" color="red" />}
          {!isRecording && <FAIcon name="stop" color="gray" />}
        </span>&nbsp;
        Streaming&nbsp;
        {videoDeviceId && <FAIcon color="green" name="video-camera" />}
        {audioDeviceId && <FAIcon color="green" name="microphone" />}&nbsp;
        <span className="media-size-label">
          {/* Status: {status} ({recorderState}), */}
          {moment.duration(duration, 'milliseconds').format('hh:mm:ss', {
            trim: false
          })}
        </span>
      </span>);

      const recorderState = recorder && recorder.state;

      videoProps = {

      };

      if (!isOffline) {
        videoProps.controls = 1;
      }

      contentEl = (<div>
        {/* <div>
          <Button bsStyle="primary">Switch playback/live stream</Button>
        </div> */}
        <div>
          <input className="full-width" placeholder="TODO: title" />
        </div>
        <Panel><Panel.Body>
          TODO: tags, users, privacy etc.
        </Panel.Body></Panel>
        {size > 1 && <Panel><Panel.Body>
          <Flexbox justifyContent="space-between" alignItems="center">
            <Flexbox className="full-width">
              <Button onClick={this.clickStartDownload}
                disabled={size < 1} block>
                <Flexbox justifyContent="flex-start" alignItems="center" className="inline-hcentered">
                  <Flexbox>
                    Download&nbsp;
                  </Flexbox>
                  <Flexbox>
                    <FAIcon name="download" />
                  </Flexbox>
                  <Flexbox>
                    &nbsp;(<span className="media-size-label">{renderSize(size)}</span>)
                  </Flexbox>
                </Flexbox>
              </Button>
            </Flexbox>
            <Flexbox className="full-width">
              <Button bsStyle="success" disabled={!canUpload} block>
                Upload <FAIcon color="" name="upload" />
              </Button>
            </Flexbox>
            <Flexbox className="full-width">
              <Button bsStyle="danger" disabled={!hasStarted} onClick={this.clickFinish} block>
                Finish <FAIcon name="stop" />
              </Button>
            </Flexbox>
          </Flexbox>
        </Panel.Body></Panel>}
        <br />
        <br />
        <div>
          <Button className="inline-hcentered" bsStyle="danger" disabled={isOffline} onClick={this.clickShutdown}>
            Shutdown&nbsp;
            <FAIcon color="yellow" name="exclamation-triangle" />
          </Button>
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          <Button className="inline-hcentered" bsStyle="danger" disabled={isOffline} onClick={this.startNewStream}>
            Start over&nbsp;
            <FAIcon color="yellow" name="refresh" />
          </Button>
        </div>
      </div>);
    }

    //this.continueSelfUpdate();


    if (this.liveVideoEl) {
      //this.liveVideoEl.currentTime = parseInt(Math.round(duration / 1000));
      this.liveVideoEl.currentTime = 0;
    }
    return (<div className="media-stream-panel">
      <h2 className="inline-hcentered">
        {titleEl}
      </h2>
      {!isOffline && <div className="inline-hcentered">
        <RecorderCtrlButton />
      </div>}
      <div>
        <video {...videoProps} muted className="media-panel-video"
          ref={this.onLiveVideoDOMReady} />
      </div>
      {contentEl}
    </div>);
  }
}
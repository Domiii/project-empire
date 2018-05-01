import map from 'lodash/map';
import zipObject from 'lodash/zipObject';
import flatten from 'lodash/flatten';

import moment from 'moment';

import React, { Fragment, Component } from 'react';
import PropTypes from 'prop-types';
import dataBind from 'src/dbdi/react/dataBind';

import filesize from 'filesize';

import FAIcon from 'src/views/components/util/FAIcon';
import LoadIndicator from 'src/views/components/util/loading';

import {
  Alert, Button, Jumbotron, Well, Panel, ProgressBar
} from 'react-bootstrap';

import Flexbox from 'flexbox-react';

//import { Z_DEFAULT_COMPRESSION } from 'zlib';

import MediaInputSelect from './MediaInputSelect';
import VideoPlayer from './VideoPlayer';
import StreamFileList from './StreamFileList';
import { YtMyChannelInfo, YtStatusPanel } from './VideoUploadPanel';

import { MediaStatus } from '../../../core/multimedia/StreamModel';


function log(...args) {
  console.log(...args);
}

const renderSize = filesize.partial({
  base: 10,
  round: 2
});

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

@dataBind({})
class DownloadStreamFileButton extends Component {
  render(
    { streamArgs, disabled },
    { streamSize, streamUrl }
  ) {
    const size = streamSize(streamArgs);
    const href = disabled ? '' : (streamUrl(streamArgs) + '?s=' + size);
    return (<a href={href} download="stream.webm" target="_blank" role="button"
      className="btn btn-info btn-block">
      <Flexbox justifyContent="center" alignItems="center" className="inline-hcenter">
        <Flexbox>
          Download&nbsp;
        </Flexbox>
        <Flexbox>
          <FAIcon name="download" />
        </Flexbox>
        <Flexbox>
          &nbsp;(<span className="digital-number-font">{renderSize(size)}</span>)
        </Flexbox>
      </Flexbox>
    </a>);
  }
}


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

    this.state = {};

    this.dataBindMethods(
      //'componentDidMount',
      '_attachStreamToLiveVideo',
      'startNewStream',
      'clickStartReplay',
      'clickFinish',
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

  clickStartReplay = (evt,
    { streamArgs },
    { streamDuration, streamUrl }
  ) => {
    // const blob = buildStreamFileSuperBlob(streamArgs);
    // const url = window.URL.createObjectURL(blob);
    const duration = streamDuration(streamArgs);
    this.setState({
      replayVideoSrc: streamUrl(streamArgs) + '?d=' + duration,
      replayDuration: duration / 1000
    });
  }

  clickFinish = (evt,
    { streamArgs },
    { stopStreamRecorder }
  ) => {
    stopStreamRecorder(streamArgs);
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
    { streamStatus,
      streamRecorderMimeType,
      isStreamActive, isStreamReady, isStreamOffline,
      streamSize, streamDuration },
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
      //const canUpload = status === MediaStatus.Finished;
      const canUpload = size > 1;

      titleEl = (<span>
        <span>
          {isRecording && <FAIcon className="slow-blink" name="circle" color="red" />}
          {!isRecording && <FAIcon name="stop" color="gray" />}
        </span>&nbsp;
        Streaming&nbsp;
        {videoDeviceId && <FAIcon color="green" name="video-camera" />}
        {audioDeviceId && <FAIcon color="green" name="microphone" />}&nbsp;
        <span className="digital-number-font">
          {/* Status: {status} ({recorderState}), */}
          {moment.duration(duration, 'milliseconds').format('hh:mm:ss', {
            trim: false
          })}
        </span>
      </span>);

      videoProps = {

      };


      // TODO: handle two different modes in a single player
      //  * in both modes, always update the total duration
      //  * in live mode:
      //    * when entering, set srcObject, and unset src instead, set currentTime to duration
      //    * set VideoPlayer's videoEl.srcObject to live stream
      //    * but also keep updating the duration
      //    * when seeking anywhere, go into preview mode
      //  * in preview mode:
      //    * when entering, unset srcObject, and set src (to last cached src) instead
      //    * when seeking to a currentTime > currentDuration, before actually updating currentTime, create new src whose duration exceeds currentTime

      const { replayVideoSrc, replayDuration } = this.state;
      const replayVideoProps = replayVideoSrc && {
        duration: replayDuration,
        autoplay: true,
        controls: true,
        loop: false,
        muted: true,
        inactivityTimeout: 0, // never hide controls
        refresh: this.clickStartReplay,
        src: {
          src: replayVideoSrc,
          type: streamRecorderMimeType(streamArgs)
        }
      };


      if (!isOffline) {
        videoProps.controls = 1;
      }

      contentEl = (<div>
        <Flexbox justifyContent="center" alignItems="center">
          <Flexbox className="full-width">
            <Panel className="full-height full-width">
              <Panel.Heading>Live</Panel.Heading>
              <Panel.Body className="no-padding">
                <video {...videoProps} muted className="media-panel-video"
                  ref={this.onLiveVideoDOMReady} />
              </Panel.Body>
            </Panel>
          </Flexbox>
          <Flexbox className="full-width">
            {replayVideoSrc && <Panel className="full-height full-width">
              <Panel.Heading>Preview</Panel.Heading>
              <Panel.Body className="no-padding">
                <VideoPlayer className="media-panel-video" {...replayVideoProps} />
              </Panel.Body>
            </Panel>}

            {!replayVideoSrc && (<Button className="inline-hcenter" disabled={size < 1} onClick={this.clickStartReplay}>
              Start Preview
            </Button>)}
          </Flexbox>
        </Flexbox>
        <div>
          <input className="full-width" placeholder="TODO: title" />
        </div>
        <Panel><Panel.Body>
          TODO: tags, users, privacy etc.
        </Panel.Body></Panel>
        {size > 1 && <Panel><Panel.Body>
          <Flexbox justifyContent="space-between" alignItems="center">
            <Flexbox className="full-width">
              <DownloadStreamFileButton disabled={size < 1} streamArgs={streamArgs} />
            </Flexbox>
            <Flexbox className="full-width">
              <Button bsStyle="success" disabled={!canUpload} block>
                Upload <FAIcon color="red" size="1.5em" name="youtube-play" />
              </Button>
            </Flexbox>
            <Flexbox className="full-width">
              <Button bsStyle="danger" disabled={!hasStarted} onClick={this.clickFinish} block>
                Finish <FAIcon name="stop" />
              </Button>
            </Flexbox>
          </Flexbox>
        </Panel.Body></Panel>
        }
        <br />
        <br />
        <div>
          <Button className="inline-hcenter" bsStyle="danger" disabled={isOffline} onClick={this.clickShutdown}>
            Shutdown&nbsp;
            <FAIcon color="yellow" name="exclamation-triangle" />
          </Button>
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          <Button className="inline-hcenter" bsStyle="danger" disabled={isOffline} onClick={this.startNewStream}>
            Start over&nbsp;
            <FAIcon color="yellow" name="refresh" />
          </Button>
        </div>
      </div >);
    }

    return (<div className="media-stream-panel">
      <Flexbox justifyContent="center" alignItems="center" >
        <Flexbox className="full-width margin-auto">
          <h2>{titleEl}</h2>
        </Flexbox>
        <Flexbox>
          <YtStatusPanel />
        </Flexbox>
      </Flexbox>
      {!isOffline && <div className="inline-hcenter">
        <RecorderCtrlButton />
      </div>}
      {contentEl}

      <br />
      <br />
      <StreamFileList />
    </div>);
  }
}
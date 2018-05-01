import map from 'lodash/map';
import zipObject from 'lodash/zipObject';
import flatten from 'lodash/flatten';

import moment from 'moment';

import React, { Fragment, Component } from 'react';
import PropTypes from 'prop-types';
import dataBind from 'src/dbdi/react/dataBind';

import FAIcon from 'src/views/components/util/FAIcon';
import LoadIndicator from 'src/views/components/util/loading';

import {
  Alert, Button, Jumbotron, Well, Panel, ProgressBar
} from 'react-bootstrap';

import Flexbox from 'flexbox-react';

//import { Z_DEFAULT_COMPRESSION } from 'zlib';

import VideoPlayer from './VideoPlayer';

import { GapiStatus } from '../../../core/multimedia/youtube/YouTubeAPI';
import { NOT_LOADED } from '../../../dbdi/react';
import { YtUploadStatus } from '../../../core/multimedia/youtube/YtUploadModel';
import { isString } from 'util';






/**
 * ############################################################
 * YtMyChannelInfo
 * ############################################################
 */

/**
 * Display -if authed- the selected channel.
 */
@dataBind({
  async clickSelectChannel(evt, { },
    {
      gapiDisconnect,
      //gapiHardAuth, 
      set_ytMyChannels
    }) {
    await gapiDisconnect({ prompt: 'select_account' });
    set_ytMyChannels(NOT_LOADED);
  }
})
export class YtMyChannelInfo extends Component {
  constructor(...args) {
    super(...args);

    this.dataBindMethods(
      'componentDidMount'
    );
  }

  async componentDidMount({ }, { gapiSoftAuth }) {
    await gapiSoftAuth();
  }

  render(
    { },
    { get_ytMyChannelSnippet, get_ytMyChannels, clickSelectChannel },
    { gapiIsAuthenticated, gapiError }
  ) {
    // if (!gapiIsAuthenticated || !!gapiError) {
    //   return '';
    // }
    if (!get_ytMyChannels.isLoaded()) {
      return <LoadIndicator message="loading your channel..." />;
    }
    else {
      //myChannelsEl = JSON.stringify(ytMyChannels, null, 2);
      const snippet = get_ytMyChannelSnippet();
      if (!snippet) {
        return (<Alert bsStyle="warning" className="inline no-margin">
          You do not have a YouTube channel. Create one, then refresh.
        </Alert>);
      }
      const { title, thumbnails } = snippet;
      const thumbUrl = thumbnails.default.url;
      return (<div className="no-wrap inline-hcenter">
        <img src={thumbUrl} className="max-size-2" /> {title} &nbsp;
        <a href="https://www.youtube.com/my_videos" rel="noopener noreferrer" target="_blank"><FAIcon name="sign-out" /></a>
        <Button onClick={clickSelectChannel} bsSize="small" className="no-padding"><FAIcon name="exchange" /></Button>
      </div>);
    }
  }
}


/**
 * ############################################################
 * YtStatusPanel
 * ############################################################
 */

/**
 * Display the current auth status and -if authed- the selected channel.
 */
@dataBind({
  clickResetGapiStatus(evt,
    { },
    { resetGapiStatus }
  ) {
    return resetGapiStatus();
  },

  async clickGapiHardAuth(evt,
    { },
    { gapiHardAuth, gapiDisconnect }
  ) {
    await gapiDisconnect();
    return gapiHardAuth();
  }
})
export class YtStatusPanel extends Component {
  constructor(...args) {
    super(...args);

    this.dataBindMethods(
      'clearError',
      'componentDidMount'
    );
  }

  clearError = (evt, { }, { set_gapiError }) => {
    set_gapiError(null);
  }

  componentDidMount({ }, { gapiSoftAuth }) {
    gapiSoftAuth();
  }

  render(
    { },
    { clickResetGapiStatus,
      clickGapiHardAuth },
    { gapiStatus, gapiError }
  ) {
    let statusEl;

    switch (gapiStatus) {
      case GapiStatus.NeedUserConsent:
        statusEl = (<Alert bsStyle="warning" className="no-margin">
          Please login and choose your YouTube channel:&nbsp;
          <Button onClick={clickGapiHardAuth}><FAIcon name="unlock" color="green" /></Button>
        </Alert>);
        break;

      case GapiStatus.PopupBlocked:
        statusEl = (<Alert bsStyle="danger" className="no-margin">
          <FAIcon name="times" /> Authorization popup blocked! → Unblock → then click this button:&nbsp;
          <Button onClick={clickResetGapiStatus}><FAIcon name="refresh" /></Button>
        </Alert>);
        break;

      case GapiStatus.Authorizing:
        statusEl = <LoadIndicator block message="authorizing..." />;
        break;

      case GapiStatus.Authorized:
        statusEl = <YtMyChannelInfo />;
        break;

      default:
        statusEl = <LoadIndicator block message="initializing..." />;
    }


    // TODO: there is something really wrong here!
    let errInfo = gapiError && (gapiError.stack || gapiError.message || gapiError.details || gapiError.error || gapiError);
    errInfo = errInfo && (
      isString(errInfo) ? errInfo : JSON.stringify(errInfo)
    );

    return (<Panel.Body>
      <div>
        {statusEl}
        {gapiError && (<Alert bsStyle="danger" className="alert-dismissable no-margin">
          <a href="#" className="close" data-dismiss="alert" aria-label="close" onClick={this.clearError}>&times;</a>
          {errInfo}
          <Button onClick={clickGapiHardAuth}><FAIcon name="unlock" color="green" /></Button>
        </Alert>)}
      </div>
    </Panel.Body>);
  }
}


/**
 * ############################################################
 * VideoUploadPanel
 * ############################################################
 */

@dataBind({
  clickStart(evt,
    { fileId },
    { ytStartVideoUpload }
  ) {
    return ytStartVideoUpload({ fileId });
  }
})
export default class VideoUploadPanel extends Component {
  render(
    { fileId },
    { clickStart, ytVideoId, ytVideoEditUrl, get_ytUploadStatus,
      get_ytUploadProgress, streamFileSize, ytUploadError, ytDangerousHTMLEmbedCode },
    { gapiIsAuthenticated }
  ) {
    const fileArgs = { fileId };
    const uploadStatus = get_ytUploadStatus(fileArgs);
    const size = streamFileSize(fileArgs);
    let progressEl;
    let controlEl;
    const canUpload = gapiIsAuthenticated && size > 1;
    let err = ytUploadError(fileArgs);

    switch (uploadStatus) {
      case YtUploadStatus.None:
        progressEl = (
          !gapiIsAuthenticated && <YtMyChannelInfo />
        );
        controlEl = (<Button onClick={clickStart} disabled={!canUpload}>
          Upload <FAIcon color="red" size="1.5em" name="youtube-play" />
        </Button>);
        break;
      case YtUploadStatus.Uploading: {
        const uploadInfo = get_ytUploadProgress(fileArgs);
        if (!uploadInfo) {
          progressEl = (<Fragment>
            &nbsp;preparing&nbsp;<ProgressBar active bsStyle="info" className="full-width color-maroon"
              now={100} label={''} />
          </Fragment>);
        }
        else {
          const {
            // bytesUploaded,
            // totalBytes,
            // bytesPerSecond,
            uploadPct,
            estimatedSecondsRemaining
          } = uploadInfo;

          const progressLabel = `${uploadPct}% (${moment.duration(estimatedSecondsRemaining, 'seconds').format()})`;
          progressEl = (<Fragment>
            &nbsp;uploading&nbsp;<ProgressBar active bsStyle="warning" className="full-width color-maroon"
              now={uploadPct} label={progressLabel} />
          </Fragment>);
        }
        break;
      }
      case YtUploadStatus.Processing:
      case YtUploadStatus.Finished: {
        if (uploadStatus === YtUploadStatus.Processing) {
          if (err) {
            progressEl = (<Alert bsStyle="danger" className="full-width no-margin">
              Upload failed :(&nbsp;
              <pre className="no-background inline">
                {err}
              </pre>
            </Alert>
            );
            err = null;
          }
          else {
            progressEl = (
              <Fragment>
                &nbsp;processing&nbsp;<ProgressBar active bsStyle="warning" className="full-width color-maroon"
                  now={100} label={''} />
              </Fragment>
            );
          }
        }
        else {
          const embedCode = ytDangerousHTMLEmbedCode(fileArgs);
          progressEl = (
            <Fragment>
              <Alert bsStyle="success" className="no-margin">Finished upload!</Alert>
              <div dangerouslySetInnerHTML={embedCode} />
              {/* <pre>{JSON.stringify(, null, 2)}</pre> */}
            </Fragment>
          );
        }

        const videoId = ytVideoId(fileArgs);
        controlEl = (<Fragment>
          <a className="btn btn-info link" href={ytVideoEditUrl({ videoId })} target="_blank">
            <FAIcon name="edit" />
          </a>
        </Fragment>);
        break;
      }
      default: {
        break;
      }
    }

    return (
      <Flexbox justifyContent="center" alignItems="center" className="full-width">
        {err && <Flexbox className="">
          <Alert bsStyle="danger" className="no-margin">
            <pre className="no-background">{err}</pre>
          </Alert>
        </Flexbox>}
        <Flexbox className="full-width inline-hcenter">
          {progressEl}
          {/* <ProgressBar active bsStyle="success" now={50} className="color-maroon full-width" label={'test here'} /> */}
        </Flexbox>
        <Flexbox>
          {controlEl}
        </Flexbox>
      </Flexbox>);
  }
}
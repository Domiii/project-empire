import map from 'lodash/map';
import size from 'lodash/size';

import { EmptyObject, EmptyArray } from '../../../util';

import React, { Component, Fragment as F } from 'react';
import dataBind, { NOT_LOADED } from '../../../dbdi/react/dataBind';

import {
  Button, Alert, Panel, Table
} from 'react-bootstrap';
import Moment from 'react-moment';
import styled from 'styled-components';
import Flexbox from 'flexbox-react';

import ImageLoader from 'src/views/components/util/react-imageloader';
import LoadIndicator from 'src/views/components/util/LoadIndicator';
import FAIcon from 'src/views/components/util/FAIcon';

import MediaStreamPanel, { MediaPrepView } from 'src/views/components/multimedia/MediaStreamPanel';

import {
  PresentationStatus,
  PresentationViewMode
} from '../../../core/presentations/PresentationModel';
import { YtStatusPanel } from '../multimedia/VideoUploadPanel';

import { PresentationInfoRow } from './PresentationRow';
import { MediaStatus } from '../../../core/multimedia/StreamModel';



@dataBind({
  async clickStartStreaming(streamArgs,
    sessionArgs,
    { startPresentationSessionStreaming }
  ) {
    await startPresentationSessionStreaming(sessionArgs);
  },

  async onStartStreamRecorder(streamArgs,
    { presentationId },
    { startPresentationSessionStreamRecording }
  ) {
    console.warn('onStartStreamRecorder', streamArgs, presentationId);
    return startPresentationSessionStreamRecording({
      presentationId,
      streamArgs
    });
  },

  async onFinished(streamArgs, sessionArgs, { finishPresentationSessionStreaming }) {
    return await finishPresentationSessionStreaming(sessionArgs);
  },

  clickSetStatusFinished(evt, sessionArgs, { finishPresentationSessionStreaming }) {
    finishPresentationSessionStreaming(sessionArgs);
  },

  clickSetStatusSkipped(evt, sessionArgs, { skipPresentationInSession }) {
    skipPresentationInSession(sessionArgs);
  },

  clickUnsetFileId(evt, allArgs, { set_presentationFileId }) {
    set_presentationFileId(allArgs, null);
  }
})
class PresentationSessionStreamingPanel extends Component {
  render(
    { sessionId, presentationId },
    { streamFileId, streamFileExists, get_streamStatus, isStreamActive,
      get_presentationStatus, get_presentationFileId,
      clickSetStatusFinished, clickSetStatusSkipped,
      onStartStreamRecorder, onFinished,
      clickUnsetFileId }
  ) {
    const presentationArgs = {
      presentationId
    };
    const streamArgs = {
      streamId: sessionId
    };
    const fileArgs = {
      fileId: presentationId
    };

    const status = get_presentationStatus(presentationArgs);
    const streamStatus = get_streamStatus(streamArgs);
    const streamNotStarted = streamStatus === MediaStatus.Down || streamStatus === MediaStatus.Ready;
    //console.warn(streamNotStarted, streamNotStarted);
    if (status === NOT_LOADED ||
      (streamNotStarted & streamFileExists(fileArgs) === NOT_LOADED)) {
      return <LoadIndicator block size="2em" />;
    }

    let errorEl;
    const fileId = get_presentationFileId(presentationArgs);
    if (fileId) {
      //console.warn(presentationId, get_presentationFileId(presentationArgs));
      const currentSessionFileId = streamFileId(streamArgs);
      if (currentSessionFileId && presentationId !== currentSessionFileId) {
        console.error('BUG: fileId and presentationId diverged', presentationId, streamFileId(streamArgs));
        errorEl = (<Alert bsStyle="danger">BUG: fileId and presentationId diverged!</Alert>);
      }
      else if (streamNotStarted && streamFileExists(fileArgs)) {
        errorEl = (<div>
          <Alert bsStyle="danger">這個簡報已經有檔案。重錄嗎？</Alert>
          <Button bsStyle="danger" bsSize="small" onClick={clickUnsetFileId} className="display-block margin-auto">
            丟棄檔案！
          </Button>
        </div>);
      }
    }

    let finishBtn, skipBtn;
    const isStreaming = isStreamActive(streamArgs);
    if (status < PresentationStatus.Finished) {
      finishBtn = (<Button bsStyle="success" disabled={isStreaming} onClick={clickSetStatusFinished}>
        Finished <FAIcon name="check" color="lightgreen" />
      </Button>);
      skipBtn = (<Button bsStyle="danger" disabled={isStreaming || !!fileId}
        onClick={clickSetStatusSkipped}>
        Skip <FAIcon name="times" color="lightcoral" />
      </Button>);
    }

    const headerEl = ((finishBtn || skipBtn) && (<Flexbox className="">
      <Flexbox>
        <Table condensed hover className="no-margin">
          <tbody>
            <PresentationInfoRow presentationId={presentationId} />
          </tbody>
        </Table>
      </Flexbox>
      {finishBtn && <Flexbox className="">
        {finishBtn}
      </Flexbox>}
      {skipBtn && <Flexbox className="">
        {skipBtn}
      </Flexbox>}
    </Flexbox>));

    return (<div className="full-width">
      {headerEl}
      {errorEl}
      {!errorEl && <MediaStreamPanel hideStatus={true} streamArgs={streamArgs}
        // startStreaming={clickStartStreaming} 
        onStartStreamRecorder={onStartStreamRecorder}
        onFinished={onFinished} />}
    </div>);
  }
}

@dataBind({
  clickStop(evt,
    args,
    { stopOperatingPresentationSession }
  ) {
    stopOperatingPresentationSession(args);
  },
  clickFixAll(evt, sessionArgs, { fixPresentationSession }) {
    fixPresentationSession(sessionArgs);
  }
})
class Footer extends Component {
  render(
    { },
    { clickStop },
    { }
  ) {
    return (<div>
      <Button bsSize="small" bsStyle="danger" onClick={clickStop}>
        Stop Operating
      </Button>
    </div>);
  }
}

@dataBind()
export default class PresentationSessionOperatorView extends Component {
  render(
    { sessionId },
    { presentationSessionActivePresentationId, hasPendingPresentations }
  ) {
    const sessionArgs = { sessionId };
    const presentationId = presentationSessionActivePresentationId(sessionArgs);

    if (presentationId === NOT_LOADED) {
      return (
        <LoadIndicator className="margin-auto" size="2em" block />
      );
    }

    let streamControls;
    if (presentationId || hasPendingPresentations(sessionArgs)) {
      streamControls = (<PresentationSessionStreamingPanel
        sessionId={sessionId} presentationId={presentationId} />);
    }
    else {
      streamControls = (<Flexbox className="full-width full-height" justifyContent="center" alignItems="center">
        <Alert bsStyle="info" className="margin-auto">
          Session finished!
        </Alert>
      </Flexbox>);
    }

    return (<Flexbox flexDirection="column" className="full-width full-height">
      <Flexbox className="full-width full-height">
        {streamControls}
      </Flexbox>
      <Flexbox className="">
        <Footer {...sessionArgs} />
      </Flexbox>
    </Flexbox>);
  }
}
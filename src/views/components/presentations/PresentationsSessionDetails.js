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

import { MediaPrepView } from 'src/views/components/multimedia/MediaStreamPanel';
import { YtStatusPanel } from '../multimedia/VideoUploadPanel';

import PresentationRow from './PresentationRow';


const StyledTable = styled(Table) `
`;

const UploadQueueControlPanel = dataBind({
  clickStartUploadPresentationSession(evt, sessionArgs, { startUploadPresentationSession }) {
    startUploadPresentationSession(sessionArgs);
  },
  clickTogglePresentationUploadMode(evt, sessionArgs, { isPresentationUploadMode, set_isPresentationUploadMode }) {
    const isMode = isPresentationUploadMode(sessionArgs);
    set_isPresentationUploadMode(sessionArgs, !isMode);
  }
})(function UploadQueueControlPanel(
  sessionArgs,
  { isPresentationUploadMode, getUploadReadyPresentationCount, clickTogglePresentationUploadMode,
    isVideoUploadQueueRunning,
    videoUploadQueueRemainingCount, videoUploadQueueTotalCount,
    clickStartUploadPresentationSession }
) {
  // upload buttons + queue status
  let queueStatusEl, queueControls, toggleModeButton;

  const isUploadMode = isPresentationUploadMode(sessionArgs);
  if (isUploadMode) {
    const { sessionId } = sessionArgs;
    const queueArgs = { queueId: sessionId };
    const isUploading = isVideoUploadQueueRunning(queueArgs);

    if (isUploading) {
      const remainCount = videoUploadQueueRemainingCount(queueArgs);
      const totalCount = videoUploadQueueTotalCount(queueArgs);
      const doneCount = totalCount - remainCount;
      queueStatusEl = (<F>
        <span>{doneCount}/{totalCount}</span>
      </F>);
    }


    const uploadReadyCount = getUploadReadyPresentationCount(sessionArgs);
    queueControls = (<F>
      <Button bsStyle="info" disabled={isUploading || !uploadReadyCount} onClick={clickStartUploadPresentationSession} >
        Upload <FAIcon name="upload" /> ({uploadReadyCount})
      </Button>
      <YtStatusPanel />
    </F>);
  }

  toggleModeButton = (<F>
    <Button bsStyle="info" onClick={clickTogglePresentationUploadMode} active={isUploadMode}>
      <FAIcon name="upload" color={isUploadMode && 'lightgreen' || ''} /> <FAIcon name="youtube" size="1.4em" color="red" />
    </Button>
  </F>);
  return (<F>
    {queueStatusEl}
    {queueControls}
    {toggleModeButton}
  </F>);
});

/**
 * Shown on top of the table
 */
const SessionToolbar = dataBind({})(function SessionHeader(
  sessionArgs,
  { },
  { isCurrentUserAdmin }
) {
  let controlEls;
  if (isCurrentUserAdmin) {
    const { sessionId } = sessionArgs;
    controlEls = <UploadQueueControlPanel sessionId={sessionId} />;
  }

  return (<Flexbox className="full-width">
    <Flexbox className="full-width" justifyContent="flex-start">
    </Flexbox>
    <Flexbox justifyContent="flex-end" className="spaced-inline-children">
      {controlEls}
    </Flexbox>
  </Flexbox>);
});

const SessionHeader = dataBind({
  startStreaming(streamArgs,
    sessionArgs,
    { startPresentationSessionStreaming }
  ) {
    startPresentationSessionStreaming(sessionArgs);
  }
})(function SessionHeader(
  sessionArgs,
  { isPresentationSessionInProgress, startStreaming },
  { isCurrentUserAdmin }
) {
  let introEl;
  const { sessionId } = sessionArgs;
  const canStartStreaming = (
    isCurrentUserAdmin && !isPresentationSessionInProgress(sessionArgs)
  );
  if (canStartStreaming) {
    introEl = <MediaPrepView streamId={sessionId} startStreaming={startStreaming} />;
    //introEl = (<Button bsStyle="danger" bsSize="large" onClick={clickStartStreaming} block>Start streaming!</Button>);
  }
  return (<F>
    <SessionToolbar sessionId={sessionId} />
    {introEl}
  </F>);
});

@dataBind({
  clickAddPresentation(evt, 
    { sessionId }, 
    { addNewPresentation }
  ) {
    return addNewPresentation({ sessionId });
  },
  clickStartLiveSession(evt,
    { sessionId },
    { set_livePresentationSessionId }
  ) {
    set_livePresentationSessionId(sessionId);
  },
  clickStopLiveSession(evt,
    { },
    { set_livePresentationSessionId }
  ) {
    set_livePresentationSessionId(null);
  }
})
class PresentationSessionControls extends Component {
  render(
    { sessionId },
    { clickAddPresentation, clickStartLiveSession, clickStopLiveSession },
    { livePresentationSessionId }
  ) {
    if (livePresentationSessionId === NOT_LOADED) {
      return <LoadIndicator />;
    }
    const addBtn = (<Button bsStyle="success"
      onClick={clickAddPresentation}>
      Add presentation <FAIcon name="plus" />
    </Button>);

    const isLive = livePresentationSessionId === sessionId;
    const stopLiveSessionBtn = (isLive &&
      <Button bsStyle="danger"
        onClick={clickStopLiveSession}>
        Finish live session
      </Button>
    );

    const startLiveSessionBtn = (!isLive &&
      <Button bsStyle="danger"
        disabled={livePresentationSessionId}
        onClick={clickStartLiveSession}>
        Go live!
      </Button>
    );

    return (<div className="spaced-inline-children-2">
      {addBtn}
      {startLiveSessionBtn}
      {stopLiveSessionBtn}
    </div>);
  }
}

@dataBind({})
export default class PresentationsSessionDetails extends Component {
  state = { };

  selectRow = (id) => {
    const { selectedPresentation } = this.state;
    if (selectedPresentation === id) {
      id = null;
    }
    this.setState({ selectedPresentation: id });
  }

  render(
    { sessionId },
    { orderedPresentations, isPresentationSessionOperator },
    { isCurrentUserAdmin }
  ) {
    const sessionArgs = { sessionId };
    const presentations = orderedPresentations(sessionArgs);
    if (presentations === NOT_LOADED) {
      return <LoadIndicator block />;
    }

    const { selectedPresentation } = this.state;

    let sessionFooterControls;
    if (isCurrentUserAdmin) {
      sessionFooterControls = (
        <PresentationSessionControls {...sessionArgs} />
      );
    }

    const isOperator = isPresentationSessionOperator(sessionArgs);

    return (<F>
      <SessionHeader sessionId={sessionId} />

      <StyledTable condensed hover>
        <thead>
          <tr>
            {/* index */}
            <th className="min">#</th>
            {/* status */}
            <th className="min"></th>
            {/* operator buttons */}
            {isOperator && <th className="min"></th>}
            <th>誰？</th>
            <th>主題</th>
            {/* <th className="min">專案狀態</th> */}
          </tr>
        </thead>
        <tbody>
          {
            map(presentations, p => (
              <PresentationRow key={p.id} sessionId={sessionId} presentation={p}
                isSelected={selectedPresentation === p.id} selectRow={this.selectRow} />
            ))
          }
        </tbody>
      </StyledTable>
      {sessionFooterControls}
    </F >);
  }
}
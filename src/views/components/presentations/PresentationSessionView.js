import React, { Component, Fragment as F } from 'react';
import dataBind from 'src/dbdi/react/dataBind';
import { NOT_LOADED } from 'src/dbdi';

import {
  Panel, Well, Alert
} from 'react-bootstrap';

import LoadIndicator from '../util/LoadIndicator';
import { Redirect } from 'react-router-dom';

import PresentationsTable from './PresentationsTable';
import { hrefPresentationSession } from '../../href';
import styled from 'styled-components';
import { LoadOverlay } from '../overlays';


const LiveTitle = styled(Well)`
margin: auto;
text-align: center;
background-color: transparent;
`;


function getSelectedId() {
  return window.location.hash && window.location.hash.substring(1);
}

@dataBind()
export class LiveView extends Component {
  render(
    { sessionId },
    { },
    { }
  ) {
    return (<F>
      TODO: proper "presentation streaming view"
      TODO: generate + show list of pending presentations
    </F>);
  }
}

@dataBind()
export default class PresentationSessionView extends Component {
  render(
    { sessionId },
    { get_presentationSession },
    { livePresentationSessionId }
  ) {
    const session = get_presentationSession({ sessionId });
    if (session === NOT_LOADED) {
      return <LoadOverlay />;
    }
    if (!session) {
      return <Redirect to={hrefPresentationSession()} />;
    }

    const isLive = livePresentationSessionId === sessionId;
    return (<div>
      {isLive && <LiveView sessionId={sessionId} />}

      {/* table of presentations that are already done */}
      <PresentationsTable />
    </div>);
  }
}
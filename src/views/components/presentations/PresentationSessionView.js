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
      <pre>TODO
0. generate, shuffle + show table of presentations
  * at least with: title + user info
1. split presentations into two, by status
2. be able to add, edit + delete (pending) presentations
4. button to shuffle pending presentations
5. proper "presentation streaming view" + 
  * just use the same id for: streamId + fileId + presentationId?
  * store video + associate fileId in DB with presentation
6. when streaming on a different machine, don't show streaming view, but show a button to forefully take over
7. presentation timer!
      </pre>
      <pre>more TODOs
0. proper project + user tagging for presentations
  * hasMany needs to work for this
1. batch-upload to youtube
2. generate youtube playlists
3. normal user view of:
  a) presentation session + presentation
  b) own + participating playlists
4. let users provider supplementary material (at least presentation URL)
      </pre>
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
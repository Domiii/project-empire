import size from 'lodash/size';

import React, { Component, Fragment as F } from 'react';
import dataBind from 'src/dbdi/react/dataBind';
import { NOT_LOADED } from 'src/dbdi';

import {
  Panel, Well, Alert, FormControl, Button
} from 'react-bootstrap';

import LoadIndicator from '../util/LoadIndicator';
import { Redirect } from 'react-router-dom';

import PresentationsTable from './PresentationsTable';
import { hrefPresentationSession } from '../../href';
import styled from 'styled-components';
import { LoadOverlay } from '../overlays';


const InlineFormInput = styled(FormControl)`
vertical-align: middle;
text-align: center;
display: inline;
width: inherit;
`;


function getSelectedId() {
  return window.location.hash && window.location.hash.substring(1);
}


const defaultPublishId = '2PACX-1vSsOx1s1Bu9p2be7Gc1HT-tor1zJSBRO3iINyieaT0TlT_p3euML1AoIXkOSz282bjIpOypTmJRlS0n';
const defaultGid = '1483128144';

@dataBind()
class NoPresentations extends Component {
  state = {
    publishId: defaultPublishId,
    gid: defaultGid
  };

  constructor(...args) {
    super(...args);
    this.dataBindMethods('clickImport');
  }

  _onPublishChanged = (val) => {
    this.setState({ publishId: val });
  }

  _onGidChanged = (val) => {
    this.setState({ gid: val });
  }

  clickImport = async(evt, { sessionId }, { importPresentationsToSession }) => {
    const { publishId, gid } = this.state;
    this.setState({ isBusy: true });

    let result;
    try {
      result = await importPresentationsToSession({ sessionId, publishId, gid });
    }
    catch (err) {
      console.error(err && err.stack || err);
      this.setState({ error: err && err.message || err });
    }
    finally {
      if (!size(result)) {
        this.setState({ isBusy: false });
      }
    }
  }

  render() {
    // show option to import presentations
    return (<Well>
      <Alert bsStyle="warning">There are no presentations in this session</Alert>
      <h3>Import from Spreadsheet</h3>
      <InlineFormInput type="text" placeholder="publishId" value={this.state.publishId} onChange={this._onPublishChanged} />&nbsp;
      <InlineFormInput type="text" placeholder="gid" value={this.state.gid} onChange={this._onGidChanged} />&nbsp;
      <Button onClick={this.clickImport} disabled={this.state.isBusy}>Import!</Button>
      {this.state.isBusy && <LoadIndicator />}
      {this.state.error && <Alert bsStyle="danger">{this.state.error}</Alert>}
    </Well>);
  }
}

@dataBind()
export default class PresentationSessionView extends Component {
  render(
    { sessionId },
    { get_presentationSession, presentationCount },
    { livePresentationSessionId }
  ) {
    const session = get_presentationSession({ sessionId });
    const count = presentationCount({ sessionId });
    if (session === NOT_LOADED | count === NOT_LOADED) {
      return <LoadOverlay />;
    }
    if (!session) {
      return <Redirect to={hrefPresentationSession()} />;
    }

    const isLive = livePresentationSessionId === sessionId;

    let contentEl;
    if (!count) {
      contentEl = <NoPresentations sessionId={sessionId} />;
    }
    else {
      contentEl = (<F>
        {/* table of presentations that are already done */}
        <PresentationsTable sessionId={sessionId} />
      </F>);
    }
    return (<div>
      {contentEl}

       <pre>TODO
0. generate, shuffle + show table of presentations
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
-1. proper presentations for all users + projects
  -> account for every single user!
  -> account for every active project, and get at least a status update!
0. proper project + user tagging for presentations
  * hasMany needs to work for this
1. batch-upload to youtube
2. generate youtube playlists
3. normal user view of:
  a) presentation session + presentation
  b) own + participating playlists
4. let users provider supplementary material (at least presentation URL)
5. better import features?
      </pre>
    </div>);
  }
}
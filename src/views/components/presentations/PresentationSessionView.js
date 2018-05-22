import size from 'lodash/size';
import map from 'lodash/map';

import { EmptyObject } from '../../../util';
import { NOT_LOADED } from 'src/dbdi';

import React, { Component, Fragment as F } from 'react';
import dataBind from 'src/dbdi/react/dataBind';

import {
  Panel, Well, Alert, FormControl, Button
} from 'react-bootstrap';
import Flexbox from 'flexbox-react';
import { Redirect } from 'react-router-dom';
import styled from 'styled-components';

import { hrefPresentationSession } from '../../href';

import { LoadOverlay } from '../overlays';

import PresentationsSessionTable from './PresentationsSessionTable';

import LoadIndicator from '../util/LoadIndicator';
import FAIcon from 'src/views/components/util/FAIcon';


const defaultPublishId = '2PACX-1vSsOx1s1Bu9p2be7Gc1HT-tor1zJSBRO3iINyieaT0TlT_p3euML1AoIXkOSz282bjIpOypTmJRlS0n';
const defaultGid = '494255921';

const InlineFormInput = styled(FormControl) `
vertical-align: middle;
text-align: center;
display: inline;
width: inherit;
`;


function getSelectedId() {
  return window.location.hash && window.location.hash.substring(1);
}


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

  _onPublishChanged = (event) => {
    this.setState({ publishId: event.target.value });
  }

  _onGidChanged = (event) => {
    this.setState({ gid: event.target.value });
  }

  clickImport = async (evt, 
    { sessionId }, 
    { importPresentationsToSession }
  ) => {
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
class OrphanedPresentations extends Component {
  render(
    { },
    { get_presentations }
  ) {
    const list = get_presentations({ sessionId: null });
    const ids = Object.keys(list || EmptyObject);
    if (size(list)) {
      return (<Panel>
        <Panel.Heading>
          Orphaned Presentations
        </Panel.Heading>
        <Panel.Body className="no-margin">
          {
            map(ids, (id) => id)
          }
        </Panel.Body>
      </Panel>);
    }

    // return empty element
    return '';
  }
}


@dataBind({
  clickToggleEditMode(evt,
    { },
    { set_isPresentEditMode },
    { isPresentEditMode }
  ) {
    set_isPresentEditMode(!isPresentEditMode);
  },
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
  constructor(args) {
    super(args);

    this.dataBindMethods(
      'componentWillUnmount'
    );
  }

  componentWillUnmount(
    { },
    { set_isPresentEditMode }
  ) {
    // always leave edit mode when controls are gone
    set_isPresentEditMode(false);
  }

  render(
    { sessionId },
    { clickToggleEditMode, clickAddPresentation,
      clickStartLiveSession, clickStopLiveSession },
    { livePresentationSessionId, isPresentEditMode }
  ) {
    if (livePresentationSessionId === NOT_LOADED) {
      return <LoadIndicator />;
    }

    const editBtn = (<Button bsStyle="info"
      active={isPresentEditMode}
      onClick={clickToggleEditMode}>
      <FAIcon name="edit" />
    </Button>);

    const addBtn = (<Button bsStyle="success"
      onClick={clickAddPresentation}>
      <FAIcon name="plus" />
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

    return (<Flexbox justifyContent="space-between" alignItems="center">
      <Flexbox alignItems="center" className="spaced-inline-children-5">
        {editBtn}
        {addBtn}
      </Flexbox>
      <Flexbox alignItems="center">
        {startLiveSessionBtn}
        {stopLiveSessionBtn}
      </Flexbox>
    </Flexbox>);
  }
}


@dataBind()
export default class PresentationSessionView extends Component {
  render(
    { sessionId },
    { get_presentationSession, presentationCount },
    { isCurrentUserAdmin }
  ) {
    const sessionArgs = { sessionId };
    const session = get_presentationSession(sessionArgs);
    const count = presentationCount(sessionArgs);
    if (session === NOT_LOADED | count === NOT_LOADED) {
      return <LoadOverlay />;
    }
    if (!session) {
      return <Redirect to={hrefPresentationSession()} />;
    }

    //const isLive = livePresentationSessionId === sessionId;
    
    let sessionFooterControls;
    if (isCurrentUserAdmin) {
      sessionFooterControls = (
        <PresentationSessionControls {...sessionArgs} />
      );
    }

    let contentEl;
    if (!count) {
      contentEl = <NoPresentations sessionId={sessionId} />;
    }
    else {
      contentEl = (<F>
        <PresentationsSessionTable sessionId={sessionId} />
      </F>);
    }
    // return (<Flexbox flexDirection="column">
    return (<div>
      {contentEl}
      <OrphanedPresentations />
      {sessionFooterControls}
    </div>);
    //</Flexbox>);
  }
}
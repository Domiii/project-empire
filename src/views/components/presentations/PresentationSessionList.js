import map from 'lodash/map';
import size from 'lodash/size';

import { NOT_LOADED } from 'src/dbdi';

import React, { Component } from 'react';
import dataBind from 'src/dbdi/react/dataBind';

import styled from 'styled-components';

import {
  Button, Alert, Panel, Well
} from 'react-bootstrap';
import { withRouter } from 'react-router-dom';
import Flexbox from 'flexbox-react';

import { LoadOverlay } from '../overlays';
import { hrefPresentationSessionView } from '../../href';
import { LinkContainer } from 'react-router-bootstrap';
import FAIcon from '../util/FAIcon';

const itemsPerPage = 20;

const BigButton = styled(Button) `
  height: 4em;
  max-width: 50%;
  margin: auto;
`;

const PresentationSessionRow = dataBind()(function PresentationSessionRow(
  { presentationSessionId }
) {
  return (<Flexbox>
    <Flexbox>
      {presentationSessionId}
      <LinkContainer to={hrefPresentationSessionView(presentationSessionId)}>
        <Button><FAIcon name="mail-forward" /></Button>
      </LinkContainer>
    </Flexbox>
  </Flexbox>);
});

const PresentationSessionLiveStatusElement = withRouter(dataBind({
  clickNewPresentationSession(evt, { history }, { newPresentationSession }, { }) {
    const sessionId = newPresentationSession();
    history.push(hrefPresentationSessionView(sessionId));
  },
  clickGoToLivePresentationSession(evt, { history }, { }, { livePresentationSessionId }) {
    history.push(hrefPresentationSessionView(livePresentationSessionId));
  }
})(function PresentationSessionLiveStatusElement(
  { },
  { clickNewPresentationSession, clickGoToLivePresentationSession },
  { livePresentationSessionId }
) {
  if (livePresentationSessionId) {
    // we are currently live in action
    return (<Well className="background-none">
      <BigButton bsStyle="success" onClick={clickGoToLivePresentationSession} block>
        Go to Live session
      </BigButton>
    </Well>);
  }
  else {
    // nothing going on, yet!
    return (<Well className="background-none">
      <BigButton bsStyle="danger" onClick={clickNewPresentationSession} block>
        Start new session!
      </BigButton>
    </Well>);
  }
}));


@dataBind()
export default class PresentationSessionList extends Component {
  state = { page: 1 };

  nextPage = () => {
    this.setPage(this.state.page + 1);
  }

  render(
    { },
    { sortedPresentationSessionsIdsOfPage },
    { livePresentationSessionId }
  ) {
    const { page } = this.state;
    const ids = sortedPresentationSessionsIdsOfPage({ page });
    const itemsTitle = 'Sessions';
    const renderRow = id => <PresentationSessionRow key={id} presentationSessionId={id} />;
    const preChildren = !!livePresentationSessionId && <PresentationSessionLiveStatusElement />;
    const postChildren = !livePresentationSessionId && <PresentationSessionLiveStatusElement />;

    if (ids === NOT_LOADED) {
      return <LoadOverlay />;
    }

    const nItems = size(ids);
    const count0 = nItems ? (page - 1) * itemsPerPage + 1 : 0;
    const count1 = Math.min(nItems, page * itemsPerPage);

    return (<div>
      <Panel>
        <Panel.Heading>
          {itemsTitle} ({count0}-{count1} of {nItems})
        </Panel.Heading>
        <Panel.Body className="no-margin">
          {preChildren}
          {
            map(ids, renderRow)
          }
          {postChildren}
        </Panel.Body>
      </Panel>

      <Button disabled={nItems < page * itemsPerPage}
        onClick={this.nextPage} block>
        more...
      </Button>
    </div>);
  }
}




/**
==Basics==
  -> sometimes, recording doesn't really start when pressing the button (it's probably a race condition where fileId isn't updated - probably overrode quite a few videos :'( ))
  -> batch-upload to youtube
  -> [O] Better recording controls + static view of controls
    -> stabilize view/scroll position - http://jsfiddle.net/kirbysayshi/57HbV/ + https://bit.ly/1S2siEo
  -> [O] video file status + time of recording 
    -> status = not-started, not-local (has fileId but no file), Uploaded (has videoId)
  -> [N, O, E] skip\unskip presentation
  -> view youtube status, embed player, video's youtube link
  -> PresentationSession views: be able to go from live to list
  -> finish PresSess
  -> start new PresSess
    {}-> ideally based on all currently active projects + any individual user who does not have a project
    -> come up with manual strategy for now
  -> proper project + user tagging for presentations
      * finish relationships for this

  -> User + project management
    -> add user by name
      -> match user name to actual (but unregistered) user via admin interface
      {}-> fix all edge cases for when we merge two user objects into one, any data that references the user gets orphaned
    -> User table
      -> show all info
      -> last login time
      -> Easily edit all info
      -> Easily approve all (and/or individual) unregistered users

    -> proper presentation listing for all users + projects
      -> account for every single user!
      -> account for every active project, and get at least a status update!

  -> Add tools to easily:
    -> let presentation become project
    -> generate presentations from currently active projects
    -> archive/unarchive projects

  -> generate youtube playlists
  -> button to shuffle PENDING presentations
 */

/**
==Advanced features==
  -> three modes: [N]ormal, [E]dit, [O]perator
  -> buttons to switch between modes (only one operator at a time for now)
  -> [N, O, (E)] network-enabled presentation timer!
  -> [N] Who is up?
  -> [N] Who is next?
  -> fix preview (cannot stop preview)
  -> be able to manage + delete files (does Chrome have a built-in permanent file storage manager?)
  -> automatic audio noise + volume adjustment?

  -> [E] inline editing
  -> [E] advanced change status
  -> [E] reordering
  -> [O] when clicking button -> setActivePresentation of a pending presentation, should also re-order, move it up front

  
  -> let normal users in:
      -> presentation session + presentation
      -> own + participating playlists
      -> see + review feedback
      -> give/edit/evaluate feedback
      -> project view
      -> let users provider supplementary material (at least presentation URL)

 */
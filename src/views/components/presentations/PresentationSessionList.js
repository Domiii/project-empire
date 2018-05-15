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
  -> let [P]resenter (not only [O]) also be able to change order of presentations (→ edit mode button?)
  -> button to shuffle PENDING presentations
  -> finish PresSess
  -> import + ready up this week's presentation list!
      -> account for every single user!

  -> PresentationSession views: be able to go from live to list
  -> [N, O, (E)] network-enabled presentation timer!
  -> improve [O]perator view
    -> fix preview (cannot stop preview)

  -> finish many-2-many relationships
  -> proper project + user tagging for presentations

  -> User management
    -> add user by name
      -> match user name to actual (but unregistered) user via admin interface
      {}-> fix all edge cases for when we merge two user objects into one, any data that references the user gets orphaned
    -> User table
      -> show all info
      -> last login time
      -> Easily edit all info
      -> Easily approve all (and/or individual) unregistered users

  -> project management
    -> account for every active project
      -> possibly get a status update for each presentation that has a project in its focus

  -> generate presentation list for new session
    -> ideally based on all currently active projects + any individual user who does not have a project
    -> probably cycle based?
  -> start new project based on presentation
  -> archive/unarchive projects

  -> generate youtube playlists
 */

/**
==Advanced features==
  -> Improved presentation mode
    -> [N] Who is up?
    -> [N] Who is next?
  -> be able to manage + delete files (does Chrome have a built-in permanent file storage manager?)
  -> automatic audio noise + volume adjustment?

  -> [E] inline editing
  
  -> let normal users use this:
      -> presentation session + presentation
      -> own + participating playlists
      -> see + review feedback
      -> give/edit/evaluate feedback
      -> project view
      -> let users provider supplementary material (at least presentation URL)

 */
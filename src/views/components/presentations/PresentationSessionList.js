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




// <pre>{`TODO
// -> fix preview (doesn't update to latest src; explodes in size; cannot stop preview)
// -> need to be able to delete files
// -> be able to add, edit + delete (pending) presentations +  3. button to shuffle PENDING presentations
// -3. Profiling of PresentationSessionView (render updates slow down real bad)
// -2. User table
//   -> show all info
//   -> last login time
//   -> Easily edit all info
//   -> Easily approve all (and/or individual) unregistered users
// -1. proper presentations for all users + projects
//   -> account for every single user!
//   -> account for every active project, and get at least a status update!
// -0.5 network-enabled presentation timer!
// -0.3 linkage between the different PresentationSession views
// 0. proper project + user tagging for presentations
//   * finish relationships for this
// 1. batch-upload to youtube
// 2. generate youtube playlists
// 3. normal user functionality:
//    a) presentation session + presentation
//    b) own + participating playlists
//    c) see + review feedback
//    d) give/edit/evaluate feedback
// 4. let users provider supplementary material (at least presentation URL)
// 5. better import features?
// `}</pre>
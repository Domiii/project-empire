import map from 'lodash/map';
import size from 'lodash/size';

import { NOT_LOADED } from 'dbdi/util';
import { dataBind } from 'dbdi/react';

import React, { Component } from 'react';

import styled from 'styled-components';

import {
  Button, Alert, Panel, Well
} from 'react-bootstrap';
import { Link, withRouter } from 'react-router-dom';
// import { LinkContainer } from 'react-router-bootstrap';
import Flexbox from 'flexbox-react';

import { LoadOverlay } from '../overlays';
import { hrefPresentationSessionView, hrefPresentationSession } from '../../href';
import FAIcon from '../util/FAIcon';
import { EmptyObject } from '../../../util';

const itemsPerPage = 20;

const BigButton = styled(Button)`
  height: 4em;
  max-width: 50%;
  margin: auto;
`;

const PresentationSessionRow = withRouter(dataBind({
  async clickCopyPresentationSession(
    evt,
    { presentationSessionId, history },
    { copyPresentationSession }
  ) {
    await copyPresentationSession({ sessionId: presentationSessionId });
    history.push(hrefPresentationSession());
  }
})(function PresentationSessionRow(
  { presentationSessionId },
  { clickCopyPresentationSession }
) {
  return (<Flexbox>
    <Flexbox alignItems="center">
      <Link to={hrefPresentationSessionView(presentationSessionId)}>
        {presentationSessionId}
      </Link>

      <Button onClick={clickCopyPresentationSession}>
        Clone
      </Button>
    </Flexbox>
  </Flexbox>);
}));

const PresentationSessionLiveStatusElement = withRouter(dataBind({
  async clickNewPresentationSession(evt, 
    { history }, 
    { newPresentationSession }, 
    { }
  ) {
    // new session is automatically live
    await newPresentationSession();

    // default view is live view
    history.push(hrefPresentationSession());
  },
  clickGoToLivePresentationSession(evt,
    { history },
    { },
    { }
  ) {
    history.push(hrefPresentationSession());
  }
})(function PresentationSessionLiveStatusElement(
  { },
  { clickNewPresentationSession, clickGoToLivePresentationSession },
  { livePresentationSessionId, isCurrentUserAdmin }
) {
  if (livePresentationSessionId) {
    // we are currently live in action
    return (<Well className="background-none">
      <BigButton bsStyle="success" onClick={clickGoToLivePresentationSession} block>
        Go to Live session
      </BigButton>
    </Well>);
  }
  else if (isCurrentUserAdmin) {
    // nothing going on, yet!
    return (<Well className="background-none">
      <BigButton bsStyle="danger" onClick={clickNewPresentationSession} block>
        Start new session!
      </BigButton>
    </Well>);
  }
  return <span />;
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

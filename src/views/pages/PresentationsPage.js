import React, { Component, Fragment as F } from 'react';
import PropTypes from 'prop-types';
import { Redirect, withRouter } from 'react-router-dom';
import { dataBind } from 'dbdi/react';
import {
  hrefPresentationSession,
  hrefPresentationSessionView
} from 'src/views/href';

import {
  Alert, Button, Jumbotron, Well, Panel
} from 'react-bootstrap';
import Flexbox from 'flexbox-react';
import {
  LinkContainer
} from 'react-router-bootstrap';

import PresentationSessionList from 'src/views/components/presentations/PresentationSessionList';
import PresentationSessionLiveView from 'src/views/components/presentations/PresentationSessionLiveView';
import PresentationSessionView from 'src/views/components/presentations/PresentationSessionView';
import LiveHeader from 'src/views/components/presentations/LiveHeader';
import PresentationSessionOperatorView from 'src/views/components/presentations/PresentationSessionOperatorView';

import { NOT_LOADED } from 'dbdi/util';
import { LoadOverlay } from 'src/views/components/overlays';
import styled from 'styled-components';

const Col = styled(Flexbox)`
width: calc(50vw - 1px);
`;


const SwitchMode = withRouter(dataBind()(function ProjectPage(
  { match },
  { },
  data
) {
  const { mode, sessionId } = match.params;

  switch (mode) {
    case 'live':
      return (<PresentationSessionLiveView />);

    case 'list':
      return (<PresentationSessionList />);

    case 'view':
      if (sessionId) {
        return (<PresentationSessionView sessionId={sessionId} />);
      }
      else {
        return <Redirect to={hrefPresentationSession()} />;
      }

    default:
      // by default, decide what to show based on whether there is a live session going on
      const { livePresentationSessionId } = data;
      if (livePresentationSessionId === NOT_LOADED) {
        return <LoadOverlay />;
      }
      else if (livePresentationSessionId) {
        // current session
        return <Redirect to={hrefPresentationSession('live')} />;
      }
      else {
        // list all stuff
        return <Redirect to={hrefPresentationSession('list')} />;
      }
  }
}));


const WrappedPresentationPage = withRouter(dataBind()(function WrappedPresentationPage(
  { },
  { isPresentationSessionOperator },
  { livePresentationSessionId }
) {
  const defaultContents = (<F>
    <LiveHeader />
    <SwitchMode />
  </F>);

  const sessionId = livePresentationSessionId;
  if (sessionId &&
    isPresentationSessionOperator({ sessionId })) {
    // presentation operator mode
    return (<Flexbox className="full-width full-height">
      <Col>
        <PresentationSessionOperatorView sessionId={sessionId} />
      </Col>
      <Col className="overflow-auto">
        <div className="full-width">
          {defaultContents}
        </div>
      </Col>
    </Flexbox>);
  }
  else {
    // default view mode
    // NOTE: we must add overflow: auto
    //    (or else, for some reason, DnD won't get the droppable height right)
    return (<div className="container no-padding overflow-auto">
      {defaultContents}
    </div>);
  }
}));

export default WrappedPresentationPage;
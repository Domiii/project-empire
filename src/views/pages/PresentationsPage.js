import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Redirect, withRouter } from 'react-router-dom';
import dataBind from 'src/dbdi/react/dataBind';
import {
  hrefPresentationSession,
  hrefPresentationSessionView
} from 'src/views/href';

import {
  Alert, Button, Jumbotron, Well, Panel
} from 'react-bootstrap';

import {
  LinkContainer
} from 'react-router-bootstrap';

import PresentationSessionList from 'src/views/components/presentations/PresentationSessionList';
import PresentationSessionLiveView from 'src/views/components/presentations/PresentationSessionLiveView';
import PresentationSessionView from 'src/views/components/presentations/PresentationSessionView';

import { NOT_LOADED } from '../../dbdi';
import { LoadOverlay } from 'src/views/components/overlays';


const ProjectPage = withRouter(dataBind()(function ProjectPage(
  { match },
  {},
  data
) {
  const { mode } = match.params;

  switch (mode) {
    case 'live':
    return (<PresentationSessionLiveView />);
    
    case 'list':
    return (<PresentationSessionList />);

    case 'view':
    return (<PresentationSessionView />);

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


export default ProjectPage;
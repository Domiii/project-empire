import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';

import PresentationSessionView from './PresentationSessionView';
import { hrefPresentationSession } from '../../href';
import { LoadOverlay } from '../overlays';
import { dataBind } from 'dbdi/react';
import { NOT_LOADED } from 'dbdi/util';


@dataBind()
export default class PresentationSessionLiveView extends Component {
  render(
    { },
    { },
    { livePresentationSessionId }
  ) {
    if (livePresentationSessionId === NOT_LOADED) {
      return <LoadOverlay />;
    }
    if (livePresentationSessionId) {
      return <PresentationSessionView sessionId={livePresentationSessionId} />;
    }
    else {
      return <Redirect to={hrefPresentationSession()} />;
    }
  }
}
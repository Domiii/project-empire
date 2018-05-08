import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';

import PresentationSessionView from './PresentationSessionView';
import { hrefPresentationSession } from '../../href';
import { LoadOverlay } from '../overlays';
import dataBind, { NOT_LOADED } from '../../../dbdi/react/dataBind';


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
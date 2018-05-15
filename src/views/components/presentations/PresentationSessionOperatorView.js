import map from 'lodash/map';
import size from 'lodash/size';

import { EmptyObject, EmptyArray } from '../../../util';

import React, { Component, Fragment as F } from 'react';
import dataBind, { NOT_LOADED } from '../../../dbdi/react/dataBind';

import {
  Button, Alert, Panel, Table
} from 'react-bootstrap';
import Moment from 'react-moment';
import styled from 'styled-components';
import Flexbox from 'flexbox-react';

import ImageLoader from 'src/views/components/util/react-imageloader';
import LoadIndicator from 'src/views/components/util/LoadIndicator';
import FAIcon from 'src/views/components/util/FAIcon';

import MediaStreamPanel, { MediaPrepView } from 'src/views/components/multimedia/MediaStreamPanel';

import {
  PresentationStatus,
  PresentationViewMode
} from '../../../core/presentations/PresentationModel';
import { YtStatusPanel } from '../multimedia/VideoUploadPanel';




@dataBind({
  async startStreaming(streamArgs,
    sessionArgs,
    { startPresentationSessionStreaming }
  ) {
    await startPresentationSessionStreaming(sessionArgs);
  },

  onFinished(streamArgs, sessionArgs, { finishPresentationSessionStreaming }) {
    finishPresentationSessionStreaming(sessionArgs);
  },

  clickSetStatusFinished(evt, sessionArgs, { finishPresentationSessionStreaming }) {
    finishPresentationSessionStreaming(sessionArgs);
  },

  clickSetStatusSkipped(evt, sessionArgs, { skipPresentationInSession }) {
    skipPresentationInSession(sessionArgs);
  }
})
class PresentationSessionStreamingPanel extends Component {
  render(
    { sessionId, presentationId },
    { startStreaming, onFinished, streamFileId,
      get_presentationStatus,
      clickSetStatusFinished, clickSetStatusSkipped }
  ) {
    const streamArgs = {
      streamId: sessionId
    };

    let errorEl;
    const fileId = streamFileId(streamArgs);
    if (fileId && presentationId !== fileId) {
      console.error(presentationId, streamFileId(streamArgs));
      errorEl = <Alert bsStyle="danger">BUG: fileId and presentationId diverged!</Alert>;
    }

    let finishBtn, skipBtn;
    const status = get_presentationStatus({ presentationId });
    if (status < PresentationStatus.Finished) {
      finishBtn = (<Button block bsStyle="success" onClick={clickSetStatusFinished}>
        Finished <FAIcon name="check" color="lightgreen" />
      </Button>);
      skipBtn = (<Button block bsStyle="danger" onClick={clickSetStatusSkipped}>
        Skip <FAIcon name="times" color="lightred" />
      </Button>);
    }


    return (<div className="full-width">
      {(finishBtn || skipBtn) && (<Flexbox className="full-width">
        {finishBtn && <Flexbox className="full-width margin-right-3">
          {finishBtn}
        </Flexbox>}
        {skipBtn && <Flexbox className="full-width">
          {skipBtn}
        </Flexbox>}
      </Flexbox>)}
      {errorEl}
      {!errorEl && <MediaStreamPanel hideStatus={true} streamArgs={streamArgs}
        startStreaming={startStreaming} onFinished={onFinished} />}
    </div>);
  }
}

@dataBind({
  clickStop(evt,
    args,
    { stopPresentationSessionStreaming }
  ) {
    stopPresentationSessionStreaming(args);
  },
  clickFixAll(evt, sessionArgs, { fixPresentationSession }) {
    fixPresentationSession(sessionArgs);
  }
})
class Footer extends Component {
  render(
    { },
    { clickStop, clickFixAll },
    { isCurrentUserAdmin }
  ) {
    return (<div>
      <Button bsSize="small" bsStyle="danger" onClick={clickStop}>
        Stop Operating
      </Button>
      {isCurrentUserAdmin &&
        <Button bsSize="small" bsStyle="danger" onClick={clickFixAll}>
          <FAIcon name="wrench" />
        </Button>
      }
    </div>);
  }
}

@dataBind()
export default class PresentationSessionOperatorView extends Component {
  render(
    { sessionId },
    { presentationSessionActivePresentationId }
  ) {
    const sessionArgs = { sessionId };
    const presentationId = presentationSessionActivePresentationId(sessionArgs);
    const streamControls = (presentationId && <PresentationSessionStreamingPanel
      sessionId={sessionId} presentationId={presentationId} />);

    return (<Flexbox flexDirection="column" className="full-width full-height">
      <Flexbox className="full-width full-height">
        {streamControls}
      </Flexbox>
      <Flexbox className="">
        <Footer {...sessionArgs} />
      </Flexbox>
    </Flexbox>);
  }
}
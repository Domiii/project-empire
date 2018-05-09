import map from 'lodash/map';
import size from 'lodash/size';
import mapValues from 'lodash/mapValues';

import { EmptyObject } from '../../../util';

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
import { PresentationStatus } from '../../../core/presentations/PresentationModel';
import { YtStatusPanel } from '../multimedia/VideoUploadPanel';

const StyledTable = styled(Table) `
font-size: 1.5em;
`;

const statusIconProps = {
  [PresentationStatus.Pending]: ({
    name: 'clock-o',
    color: 'gray'
  }),
  [PresentationStatus.InProgress]: ({
    name: 'video-camera',
    color: 'red',
    className: 'slow-blink'
  }),
  [PresentationStatus.Finished]: ({
    name: 'check',
    color: 'green'
  }),
  [PresentationStatus.Cancelled]: ({
    name: 'times',
    color: 'red'
  })
};

const Tr = styled.tr`
  color: ${props => props.status === PresentationStatus.InProgress ? 'black' : 'lightgray'};
`;

const StatusTd = styled.td`
  text-align: center;
`;

@dataBind({
  startStreaming(streamArgs,
    sessionArgs,
    { startPresentationSessionStreaming }
  ) {
    startPresentationSessionStreaming(sessionArgs);
  },

  onFinished(streamArgs, sessionArgs, { finishPresentationSessionStreaming }) {
    finishPresentationSessionStreaming(sessionArgs);
  }
})
class PresentationSessionStreamingPanel extends Component {
  render(
    { sessionId },
    { startStreaming, onFinished }
  ) {
    const streamArgs = {
      streamId: sessionId
    };
    return (<MediaStreamPanel hideStatus={true} streamArgs={streamArgs} startStreaming={startStreaming} onFinished={onFinished} />);
  }
}


@dataBind({})
class DownloadVideoFileButton extends Component {
  render(
    { fileId },
    { streamFileUrl }
  ) {
    const url = streamFileUrl({ fileId });
    const href = url;
    // TODO: proper file name when downloading
    return (<a href={href} download="stream.webm" target="_blank" role="button"
      className="btn btn-info btn-sm no-padding no-line-height"><FAIcon name="download" /></a>);
  }
}


@dataBind({
  clickPlay(evt,
    { sessionId, presentation },
    { setActivePresentationInSession }
  ) {
    const presentationId = presentation.id;
    setActivePresentationInSession({ sessionId, presentationId });
  },
  clickInfo(evt,
    { selectRow, presentation: { id } },
    { }
  ) {
    selectRow(id);
  }
})
class PresentationInfoRow extends Component {
  render(
    { sessionId, presentation, isSelected },
    { clickPlay, clickInfo, isPresentationSessionOwner, presentationSessionActivePresentationId },
    { isAnyStreamOnline }
  ) {
    const {
      index,
      id,
      title,
      userNames,
      //status: projectStatus,
      presentationStatus
    } = presentation;

    //const clazz = presentationStatus === PresentationStatus.InProgress && 'red-highlight-border' || 'no-highlight-border';

    let rowControls;
    if (presentationStatus <= PresentationStatus.InProgress) {
      const canPlay = isPresentationSessionOwner({ sessionId }) && activePres !== id;
      rowControls = canPlay && (<F>
        &nbsp;
        <Button bsStyle="default" className="no-padding no-line-height" disabled={isAnyStreamOnline} onClick={clickPlay}>
          <FAIcon name="youtube-play" color="red" />
        </Button>
      </F>);
    }
    else if (presentationStatus === PresentationStatus.Finished) {
      rowControls = (<F>
        &nbsp;
        {/* <Button bsStyle="default" className="no-padding no-line-height" active={isSelected} onClick={clickInfo}>
          <FAIcon name="info-circle" color="darkblue" />
        </Button> */}
        <DownloadVideoFileButton fileId={id} />
      </F>);
    }

    const activePres = presentationSessionActivePresentationId({ sessionId });
    const statusEl = (<StatusTd className="min">
      <FAIcon {...statusIconProps[presentationStatus]} />
      {rowControls}
    </StatusTd>);

    return (
      <Tr className="" status={presentationStatus}>
        <td className="min">{index + 1}</td>
        <td>{title}</td>
        <td>{map(userNames, u => '@' + u).join('  ')}</td>
        {/* <td>{health}</td> */}
        {statusEl}
      </Tr>
    );
  }
}

@dataBind({})
class PresentationRow extends Component {
  render(
    { sessionId, presentation, isSelected, selectRow },
    { isPresentationSessionOwner, presentationSessionActivePresentationId }
  ) {
    const sessionArgs = { sessionId };
    let streamControls;
    if (isPresentationSessionOwner(sessionArgs) && presentationSessionActivePresentationId(sessionArgs) === presentation.id) {
      streamControls = (<tr><td colSpan="4">
        <PresentationSessionStreamingPanel sessionId={sessionId} />
      </td></tr>);
    }

    return (<F>
      <PresentationInfoRow {...{ sessionId, presentation, isSelected, selectRow }} />
      {streamControls}
    </F>);
  }
}

const SessionToolbar = dataBind({
  clickStop(evt,
    args,
    { stopPresentationSessionStreaming }
  ) {
    stopPresentationSessionStreaming(args);
  }
})(function SessionHeader(
  args,
  { isPresentationSessionOwner, isPresentationSessionInProgress,
    clickStop }
) {
  let ownerEls;
  if (!isPresentationSessionInProgress(args)) {
    if (isPresentationSessionOwner(args)) {
      //introEl = 
    }
    else {
      //introEl = <Alert bsStyle="success" bsSize="small"></Alert>;
    }
  }
  else {
    //&nbsp;
    ownerEls = (<F>
      <YtStatusPanel dontAuthAutomatically={true} />
      <Button bsSize="small" bsStyle="danger" onClick={clickStop}>Force Stop</Button>
    </F>);
  }
  return (<Flexbox className="full-width">
    <Flexbox className="full-width" justifyContent="flex-start">
    </Flexbox>
    <Flexbox justifyContent="flex-end">
      {ownerEls}
    </Flexbox>
  </Flexbox>);
});

const SessionHeader = dataBind({
  startStreaming(streamArgs,
    sessionArgs,
    { startPresentationSessionStreaming }
  ) {
    startPresentationSessionStreaming(sessionArgs);
  }
})(function SessionHeader(
  { sessionId },
  { //isPresentationSessionOwner, 
    isPresentationSessionInProgress, startStreaming }
) {
  let introEl;
  if (!isPresentationSessionInProgress({ sessionId })) {
    introEl = <MediaPrepView streamId={sessionId} startStreaming={startStreaming} />;
    //introEl = (<Button bsStyle="danger" bsSize="large" onClick={clickStartStreaming} block>Start streaming!</Button>);
  }
  return (<F>
    <SessionToolbar sessionId={sessionId} />
    {introEl}
  </F>);
});

@dataBind({
  // getTableRowData(
  //   { sessionId },
  //   { orderedPresentationsOfSession }
  // ) {
  // }
})
export default class PresentationsSessionDetails extends Component {
  state = {}

  selectRow = (id) => {
    const { selectedPresentation } = this.state;
    if (selectedPresentation === id) {
      id = null;
    }
    this.setState({ selectedPresentation: id });
  }

  render(
    { sessionId },
    { orderedPresentations }
  ) {
    const presentations = orderedPresentations({ sessionId });
    if (presentations === NOT_LOADED) {
      return <LoadIndicator block />;
    }

    const { selectedPresentation } = this.state;

    return (<F>
      <SessionHeader sessionId={sessionId} />

      <StyledTable condensed hover>
        <thead>
          <tr>
            <th className="min">#</th>
            <th>Title</th>
            <th>Contributors</th>
            {/* <th className="min">專案狀態</th> */}
            <th className="min">狀態</th>
          </tr>
        </thead>
        <tbody>
          {
            map(presentations, p => (
              <PresentationRow key={p.id} sessionId={sessionId} presentation={p}
                isSelected={selectedPresentation === p.id} selectRow={this.selectRow} />
            ))
          }
        </tbody>
      </StyledTable>
    </F>);
  }
}
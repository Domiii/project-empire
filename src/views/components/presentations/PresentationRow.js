import map from 'lodash/map';
import size from 'lodash/size';

import { EmptyObject, EmptyArray } from '../../../util';

import React, { Component, Fragment as F } from 'react';
import dataBind, { NOT_LOADED } from '../../../dbdi/react/dataBind';

import {
  Button, Alert, Panel, Table
} from 'react-bootstrap';

import styled from 'styled-components';

import FAIcon from 'src/views/components/util/FAIcon';

import VideoUploadPanel from 'src/views/components/multimedia/VideoUploadPanel';
import {
  PresentationStatus,
  //PresentationViewMode,
  isPresentationStatusGoTime
} from '../../../core/presentations/PresentationModel';

import PresentationEditor from './PresentationEditor';

const TrOfStatus = styled.tr`
  color: ${props => props.highlight ? 'black' : 'lightgray'};
`;

function FullWidthTableCell({ children, noBorder }) {
  return <tr><td className={noBorder && 'no-border' || ''} colSpan={99999}>{children}</td></tr>;
}

const CenteredTd = styled.td`
  text-align: center;
  color: black;
`;

// function _TextTd({ children }) {
//   return (<td>
//     <div>
//       {children}
//     </div>
//   </td>);
// }
// const TextTd = styled(_TextTd)`
const TextTd = styled.td`
white-space: nowrap;
overflow: hidden;
text-overflow: ellipsis;
max-width: 20vw;
font-size: 1.4em;
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
  [PresentationStatus.Skipped]: ({
    name: 'times',
    color: 'red'
  })
};
const statusIconPropsDefault = {
  name: 'question',
  color: 'grey'
};



@dataBind({})
class DownloadVideoFileButton extends Component {
  render(
    fileArgs,
    { streamFileExists, streamFileUrl }
  ) {
    let { title } = fileArgs;
    title = title || 'video';
    if (streamFileExists(fileArgs)) {
      const url = streamFileUrl(fileArgs);
      const href = url;

      // TODO: proper file name when downloading
      return (<a href={href} download={title + '.webm'} target="_blank" role="button"
        // className="btn btn-info btn-sm no-padding no-line-height"
        className="btn btn-info"
      ><FAIcon name="download" /></a>);
    }
    else {
      return '';
    }
  }
}


@dataBind({
  clickPlay(evt,
    { presentationId },
    { startPresentationInSession }
  ) {
    startPresentationInSession({ presentationId });
  }
})
class PresentationOperatorDetails extends Component {
  render(
    { presentationId },
    { clickPlay,
      get_presentation,
      isStreamActive, isPresentationSessionOperator, presentationSessionActivePresentationId,
      get_videoUploadStatus },
    { }
  ) {
    const presentation = get_presentation({ presentationId });
    const {
      sessionId,
      //status: projectStatus,
      presentationStatus
    } = presentation;

    if (!sessionId) {
      console.error('presentation has no sessionId', presentation.title, presentation);
    }

    let uploadStatusEl;
    const fileArgs = { fileId: presentationId };
    const uploadStatus = get_videoUploadStatus(fileArgs);
    if (uploadStatus) {
      // TODO: fix this
      //uploadStatusEl = uploadStatus;
    }

    let rowControls;
    const sessionArgs = { sessionId };
    const isOperator = isPresentationSessionOperator(sessionArgs);
    const activePresId = presentationSessionActivePresentationId(sessionArgs);
    //if (presentationStatus <= PresentationStatus.InProgress) {
    const streamArgs = { streamId: sessionId };
    if (isOperator && !isStreamActive(streamArgs) && activePresId !== presentationId) {
      // only show button to operator, if stream is currently offline, and this is the active presentation
      rowControls = (<F>
        <Button bsStyle="default" className="no-padding" onClick={clickPlay}>
          <FAIcon name="play" color="darkblue" />
        </Button>
      </F>);
    }

    return (<span className="spaced-inline-children">
      {uploadStatusEl}
      {rowControls}
    </span>);
  }
}

@dataBind({})
class PresentationStatusSummary extends Component {
  render(
    { presentationId, isSelected },
    { get_presentation, streamFileExists, isCurrentUserAdmin, ytVideoUrl },
    { }
  ) {
    const presentation = get_presentation({ presentationId });
    const {
      fileId,
      videoId,
      //status: projectStatus,
      presentationStatus
    } = presentation;

    let statusInfoEl, fileInfoEl;
    if (videoId && !isPresentationStatusGoTime(presentationStatus)) {
      // button to show video directly
      // TODO: inline preview youtube video
      const url = ytVideoUrl({ videoId });
      statusInfoEl = (<a href={url} target="_blank">
        <FAIcon name="youtube-play" color="red" />
      </a>);
    }
    else {
      statusInfoEl = (<FAIcon {...(statusIconProps[presentationStatus] || statusIconPropsDefault)} />);

      // we don't want the file system access warning to pop up for normal visitors
      const shouldAccessFileSystem = fileId && isCurrentUserAdmin();
      if (shouldAccessFileSystem && streamFileExists({ fileId })) {
        // (there SHOULD NEVER BE, but) there always might be inconsistencies
        if (fileId !== presentationId) {
          // shit!
          fileInfoEl = <FAIcon name="download" size=".8em" color="red" />;
        }
        else {
          // should all be great
          fileInfoEl = <FAIcon name="download" size=".8em" />;
        }
      }
    }

    return (<span className="spaced-inline-children">
      {statusInfoEl}
      {fileInfoEl}
    </span>);
  }
}


/**
 * 
 */
@dataBind({
  clickSelectRow(evt,
    { selectRow, presentationId },
    { }
  ) {
    selectRow(presentationId);
  }
})
class PresentationInfoRow extends Component {
  render(
    { sessionId, presentationId, isSelected },
    { get_presentation, isPresentationSessionOperator,
      clickSelectRow },
    { isCurrentUserAdmin }
  ) {
    const presentation = get_presentation({ presentationId });
    const {
      index,
      title,
      userNamesString,
      //status: projectStatus,
      presentationStatus
    } = presentation;

    //const clazz = presentationStatus === PresentationStatus.InProgress && 'red-highlight-border' || 'no-highlight-border';

    let onDblClick;
    const sessionArgs = { sessionId };
    const isOperator = isPresentationSessionOperator(sessionArgs);
    if (isOperator || isCurrentUserAdmin) {
      onDblClick = clickSelectRow;
    }

    const summaryCell = (<CenteredTd className="min">
      <PresentationStatusSummary isSelected={isSelected} presentationId={presentationId} />
    </CenteredTd>);

    const operatorCell = isOperator && (<CenteredTd className="min">
      <PresentationOperatorDetails isSelected={isSelected} presentationId={presentationId} />
    </CenteredTd>);

    //GoingOnStage
    const isHighlighted = presentationStatus === PresentationStatus.GoingOnStage ||
      presentationStatus === PresentationStatus.InProgress;
    return (
      <TrOfStatus className="" highlight={isHighlighted} onDoubleClick={onDblClick}>
        <td className="min">{Math.round(index) + 1}</td>
        {summaryCell}
        {operatorCell}
        <TextTd>
          {title}
        </TextTd>
        <TextTd>
          {userNamesString}
        </TextTd>
        {/* <td>{health}</td> */}
      </TrOfStatus>
    );
  }
}

@dataBind()
class PresentationRowDetails extends Component {
  render(
    { presentationId },
    { get_presentation, isPresentationSessionOperator },
    { isCurrentUserAdmin }
  ) {
    const presentation = get_presentation({ presentationId });
    const { sessionId } = presentation;
    const sessionArgs = { sessionId };
    const isOperator = isPresentationSessionOperator(sessionArgs);

    const editorEl = isCurrentUserAdmin && <PresentationEditor presentationId={presentationId} />;
    let controlEls;
    if (isOperator) {
      const fileName = presentation.title + ' (' + presentation.userNamesString + ')';
      controlEls = <DownloadVideoFileButton title={fileName} fileId={presentationId} />;
    }
    return (<div>
      {editorEl}
      {controlEls}
    </div>);
  }
}

@dataBind({})
export default class PresentationRow extends Component {
  render(
    { sessionId, presentation, isSelected, selectRow },
    { ytIsVideoUploadInProgress }
  ) {
    let detailsEl, uploadEl;

    const presentationId = presentation.id;
    if (isSelected) {
      detailsEl = (<FullWidthTableCell noBorder={true}>
        <PresentationRowDetails presentationId={presentationId} />
      </FullWidthTableCell>);
    }

    const fileArgs = { fileId: presentationId };
    if (ytIsVideoUploadInProgress(fileArgs)) {
      uploadEl = (<FullWidthTableCell noBorder={true}>
        <VideoUploadPanel {...fileArgs} />
      </FullWidthTableCell>);
    }

    return (<F>
      <PresentationInfoRow {...{ sessionId, presentationId, isSelected, selectRow }} />
      {detailsEl}
      {uploadEl}
    </F>);
  }
}
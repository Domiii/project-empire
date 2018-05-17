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
import { getOptionalArgument } from '../../../dbdi/dataAccessUtil';

const TrOfStatus = styled.tr`
  color: ${props => props.highlight ? 'black' : 'lightgray'};
  background-color: ${props => props.highlight ? 'lightyellow' : 'transparent'};
`;

function FullWidthTableCell({ children, noBorder }) {
  return (<tr><td className={noBorder && 'no-border' || ''} colSpan={99999}>
    {children}
  </td></tr>);
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
    color: 'orange'
  })
};
const statusIconPropsDefault = {
  name: 'question',
  color: 'grey'
};



@dataBind({})
class DownloadVideoFileButton extends Component {
  render(
    { title, fileId },
    { streamFileExists, streamFileUrl }
  ) {
    title = title || 'video';
    if (fileId) {
      const url = streamFileExists({ fileId }) && streamFileUrl({ fileId }) || '';
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
    { get_presentation, streamFileExists,
      isPresentationSessionOperator, isCurrentUserAdmin,
      ytVideoUrl },
    { }
  ) {
    const presentation = get_presentation({ presentationId });
    const {
      fileId,
      videoId,
      sessionId,
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
      const shouldAccessFileSystem = fileId &&
        (isCurrentUserAdmin() || isPresentationSessionOperator({ sessionId }));
      if (shouldAccessFileSystem) {
        if (!streamFileExists.isLoaded({ fileId })) {
          fileInfoEl = '.';
        }
        else if (streamFileExists({ fileId })) {
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
  },

  getShouldHighlight(
    { presentationId },
    { get_presentationStatus }
  ) {
    const presentationStatus = get_presentationStatus({ presentationId });
    return presentationStatus === PresentationStatus.GoingOnStage ||
      presentationStatus === PresentationStatus.InProgress;
  }
})
export class PresentationInfoRow extends Component {
  state = {};

  constructor(props) {
    super(props);
    this.refToEl = React.createRef();
  }

  componentDidUpdate() {
    const isHighlighted = this.props.getShouldHighlight();
    if (!isHighlighted) {
      return;
    }

    const el = this.refToEl.current;
    //isHighlighted && console.warn(isHighlighted, this.wasHighlighted, !!el);
    if (isHighlighted && !this.wasHighlighted && el && el.scrollIntoView) {
      // see https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView
      this.wasHighlighted = true;
      //console.warn('scrolling', this.props.presentationId);
      setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 250);
      //setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 1000);
    }
    else if (!isHighlighted && this.wasHighlighted) {
      this.wasHighlighted = false;
    }
  }

  render(
    args,
    { get_presentation, isPresentationSessionOperator,
      clickSelectRow, getShouldHighlight },
    { isCurrentUserAdmin }
  ) {
    const { presentationId } = args;
    const isSelected = getOptionalArgument(args, 'isSelected');
    const presentation = get_presentation({ presentationId });
    if (!presentation) {
      return '';
    }

    const {
      index,
      sessionId,
      title,
      userNamesString
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
    const isHighlighted = getShouldHighlight();

    return (
      <TrOfStatus className="" highlight={isHighlighted}
        onDoubleClick={onDblClick}>
        <td ref={this.refToEl} className="min">{Math.round(index) + 1}</td>
        {summaryCell}
        {operatorCell}
        <TextTd>
          {userNamesString}
        </TextTd>
        <TextTd>
          {title}
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

    const {
      title,
      fileId
    } = presentation;

    const editorEl = isCurrentUserAdmin && <PresentationEditor presentationId={presentationId} />;
    let controlEls;
    if (isOperator) {
      const fileName = title + ' (' + presentation.userNamesString + ')';
      controlEls = <DownloadVideoFileButton title={fileName} fileId={fileId} />;
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
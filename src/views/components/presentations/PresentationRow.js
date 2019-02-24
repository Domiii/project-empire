import map from 'lodash/map';
import size from 'lodash/size';

import { EmptyObject, EmptyArray } from '../../../util';

import React, { Component, Fragment as F } from 'react';
import { dataBind } from 'dbdi/react';
import { NOT_LOADED } from 'dbdi/util';

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
import { getOptionalArgument } from 'dbdi/util';

const TrOfStatus = styled.tr`
  color: ${({ presentationStatus }) => {
    if (presentationStatus === PresentationStatus.InProgress) {
      return 'black';
    }
    else if (presentationStatus === PresentationStatus.OnStage) {
      return 'black';
    }
    else if (presentationStatus === PresentationStatus.GettingReady) {
      return 'darkgray';
    }
    return 'lightgray';
  }};
  background-color: ${({isDragging, presentationStatus}) => {
    if (isDragging) {
      return 'rgba(150, 254, 195, 0.3)';
    }
    else if (presentationStatus === PresentationStatus.InProgress) {
      return '#FFF1F1';
    }
    else if (presentationStatus === PresentationStatus.OnStage) {
      return '#FBEEE6';
    }
    else if (presentationStatus === PresentationStatus.GettingReady) {
      return '#FFFAF3';
    }
    else {
      return 'transparent';
    }
  }}
`;

const UpArrow = styled.span`
font-size: 1.4em;
display: table;
margin: auto;
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

const ControlTd = styled.td`
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
  [PresentationStatus.GettingReady]: ({
    name: '',
    //color: 'black',
    children: <span>🏃</span>
  }),
  [PresentationStatus.OnStage]: ({
    name: '',
    //color: 'orange',
    //className: 'slow-blink',
    children: <span>💃</span>
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
  },
  clickMoveToTop(evt,
    { presentationId },
    { movePresentationUpNext }
  ) {
    movePresentationUpNext({ presentationId });
  }
})
class PresentationControls extends Component {
  render(
    { presentationId },
    { clickPlay, clickMoveToTop,
      get_presentation,
      isStreamActive, isPresentationSessionOperator, presentationSessionActivePresentationId },
    { isPresentEditMode }
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

    let rowControls;
    const sessionArgs = { sessionId };
    const isOperator = isPresentationSessionOperator(sessionArgs);
    const activePresId = presentationSessionActivePresentationId(sessionArgs);
    const streamArgs = { streamId: sessionId };
    if (isOperator && !isStreamActive(streamArgs) && activePresId !== presentationId) {
      // only show button to operator, if stream is currently offline, and this is the active presentation
      rowControls = (<F>
        <Button bsStyle="default" className="no-padding" onClick={clickPlay}>
          <FAIcon name="play" color="darkblue" />
        </Button>
      </F>);
    }
    else if ((isOperator || isPresentEditMode) && presentationStatus < PresentationStatus.OnStage) {
      rowControls = (<F>
        <div className="rotate-ccw-90 inline-hcenter">
          <Button bsStyle="default" className="no-padding line-height-half" onClick={clickMoveToTop}>
            <UpArrow>➠</UpArrow>
          </Button>
        </div>
      </F>);
    }

    return (<span className="spaced-inline-children">
      {rowControls}
    </span>);
  }
}

@dataBind({})
class PresentationStatusSummary extends Component {
  render(
    { presentationId, isSelected },
    { get_presentation, streamFileExists, streamFilePath,
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
      const statusInfoStyles = statusIconProps[presentationStatus] || statusIconPropsDefault;
      // if (statusInfoStyles.children) {
      //   statusInfoEl = (<span />);
      // }
      // else 
      {
        statusInfoEl = (<FAIcon {...statusInfoStyles} />);
      }

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
        else {
          // shit!
          console.error('missing stream file: ' + streamFilePath({fileId}));
          fileInfoEl = <FAIcon name="download" size=".8em" color="red" />;
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

  isActivePresentation(
    { presentationId },
    { get_presentationStatus }
  ) {
    const presentationStatus = get_presentationStatus({ presentationId });
    return (
      //presentationStatus === PresentationStatus.GettingReady || 
      presentationStatus === PresentationStatus.OnStage ||
      presentationStatus === PresentationStatus.InProgress
    );
  }
})
export class PresentationInfoRow extends Component {
  state = {};

  constructor(props) {
    super(props);
    this.refToEl = React.createRef();
  }

  componentDidUpdate() {
    const shouldHighlight = this.props.isActivePresentation();
    if (!shouldHighlight || this.wasHighlighted) {
      return;
    }

    const el = this.refToEl.current;
    //isHighlighted && console.warn(isHighlighted, this.wasHighlighted, !!el);
    if (shouldHighlight && el && el.scrollIntoView) {
      // see https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView
      this.wasHighlighted = true;
      //console.warn('scrolling', this.props.presentationId);
      setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 250);

      setTimeout(() => {
        // do not highlight again for a little while
        this.wasHighlighted = false;
      }, 5000);
      //setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 1000);
    }
    // else if (!shouldHighlight && this.wasHighlighted) {
    //   this.wasHighlighted = false;
    // }
  }

  render(
    args,
    { get_presentation, isPresentationSessionOperator,
      clickSelectRow,
      isActivePresentation },
    { isCurrentUserAdmin, isPresentEditMode }
  ) {
    const { presentationId } = args;
    const isSelected = getOptionalArgument(args, 'isSelected');
    const isDragging = getOptionalArgument(args, 'isDragging');
    const dragProvided = getOptionalArgument(args, 'dragProvided');
    const canDrag = !!dragProvided;

    const presentation = get_presentation({ presentationId });
    if (!presentation) {
      return <tr><td>&nbsp;</td></tr>;
    }

    const {
      index,
      sessionId,
      title,
      userNamesString,
      presentationStatus
    } = presentation;

    //const clazz = presentationStatus === PresentationStatus.InProgress && 'red-highlight-border' || 'no-highlight-border';

    let onDblClick;
    const sessionArgs = { sessionId };
    // TODO: sessionId sometimes null (probably in operator view before the actual list has been loaded)
    !sessionId && console.error(sessionId, 'sessionId not given: ', presentation);
    const isOperator = isPresentationSessionOperator(sessionArgs);
    if (isOperator || isCurrentUserAdmin) {
      onDblClick = clickSelectRow;
    }

    const summaryCell = (<ControlTd className="min no-padding">
      <PresentationStatusSummary isSelected={isSelected} presentationId={presentationId} />
    </ControlTd>);

    const canControl = isOperator || isPresentEditMode;
    const controlEls = canControl && (<ControlTd className="min">
      <PresentationControls isSelected={isSelected} presentationId={presentationId} />
    </ControlTd>);

    let className = canDrag && ' grippy-left' || ' grippy-invisible';

    if (presentationStatus === PresentationStatus.OnStage) {
      className += ' slow-blink';
    }

    const dragProps = !canDrag && EmptyObject || {
      innerRef: dragProvided.innerRef,
      ...dragProvided.draggableProps
    };
    const dragHandleProps = !canDrag && EmptyObject || dragProvided.dragHandleProps;

    return (
      <TrOfStatus className={className}
        presentationStatus={presentation.presentationStatus}
        onDoubleClick={onDblClick}
        isDragging={isDragging}
        {...dragProps}
      >
        {/* the first cell is the drag handle (if any) */}
        <CenteredTd className={'min no-padding padding-right-03'}
          innerRef={this.refToEl}
          {...dragHandleProps}>
          {Math.round(index) + 1}
        </CenteredTd>

        {summaryCell}
        {controlEls}
        <TextTd>
          {userNamesString}
        </TextTd>
        <TextTd>
          {title}
        </TextTd>
        {/* <td>{health}</td> */}
      </TrOfStatus >
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
    args,
    { get_presentation, ytIsVideoUploadInProgress }
  ) {
    let detailsRow, uploadRow;

    const {
      presentationId, isSelected, selectRow
    } = args;
    const presentation = get_presentation({ presentationId });
    if (!presentation) {
      return (<FullWidthTableCell noBorder={true}>
        presentation does not exist
      </FullWidthTableCell>);
    }
    

    const draggingSnapshot = getOptionalArgument(args, 'draggingSnapshot');
    const isDragging = draggingSnapshot && draggingSnapshot.isDragging;
    const dragProvided = getOptionalArgument(args, 'dragProvided');

    if (!isDragging && isSelected) {
      detailsRow = (<FullWidthTableCell noBorder={true}>
        <PresentationRowDetails presentationId={presentationId} />
      </FullWidthTableCell>);
    }

    const fileArgs = { fileId: presentationId };
    if (!isDragging && ytIsVideoUploadInProgress(fileArgs)) {
      uploadRow = (<FullWidthTableCell noBorder={true}>
        <VideoUploadPanel {...fileArgs} />
      </FullWidthTableCell>);
    }

    const infoRowProps = {
      presentationId,
      isSelected, selectRow,
      isDragging, dragProvided,
    };

    return (<F>
      <PresentationInfoRow {...infoRowProps} />
      {detailsRow}
      {uploadRow}
    </F>);
  }
}
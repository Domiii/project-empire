import map from 'lodash/map';

import { EmptyObject, EmptyArray } from '../../../util';
import filesize from 'filesize';

import React, { Component, Fragment as F } from 'react';
import dataBind, { NOT_LOADED } from '../../../dbdi/react/dataBind';

import {
  Button, Alert, Panel, Table
} from 'react-bootstrap';
import Moment from 'react-moment';
import styled from 'styled-components';
import Flexbox from 'flexbox-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

import ImageLoader from 'src/views/components/util/react-imageloader';
import LoadIndicator from 'src/views/components/util/LoadIndicator';
import FAIcon from 'src/views/components/util/FAIcon';

import { MediaPrepView } from 'src/views/components/multimedia/MediaStreamPanel';
import { YtStatusPanel } from '../multimedia/VideoUploadPanel';

import PresentationRow from './PresentationRow';
import shallowEqual from '../../../util/shallowEqual';
import { getOptionalArguments, getOptionalArgument } from '../../../dbdi/dataAccessUtil';
import { PresentationStatus } from '../../../core/presentations/PresentationModel';


const StyledTable = styled(Table) `
`;

const TBody = styled.tbody`
`;

const renderFileSize = filesize.partial({
  base: 10,
  round: 2
});


const UploadQueueControlPanel = dataBind({
  clickStartUploadPresentationSession(evt, sessionArgs, { startUploadPresentationSession }) {
    startUploadPresentationSession(sessionArgs);
  },
  clickTogglePresentationUploadMode(evt, sessionArgs, { isPresentationUploadMode, set_isPresentationUploadMode }) {
    const isMode = isPresentationUploadMode(sessionArgs);
    set_isPresentationUploadMode(sessionArgs, !isMode);
  },
  clickDeletePresentationSessionFiles(evt, sessionArgs, {
    deletePresentationSessionFiles
  }) {
    return deletePresentationSessionFiles(sessionArgs);
  }
})(function UploadQueueControlPanel(
  sessionArgs,
  { isPresentationUploadMode, getUploadReadyPresentationCount, clickTogglePresentationUploadMode,
    isVideoUploadQueueRunning,
    videoUploadQueueRemainingCount, videoUploadQueueTotalCount,
    clickStartUploadPresentationSession,
    getPresentationSessionDeletableFileCount, getPresentationSessionDeletableFileSize,
    clickDeletePresentationSessionFiles },
  { gapiIsAuthenticated }
) {
  // upload buttons + queue status
  let queueStatusEl, queueControls, toggleModeButton;

  let fileStatusEl;
  const deletableFileCount = getPresentationSessionDeletableFileCount(sessionArgs);
  if (deletableFileCount) {
    const totalSize = renderFileSize(getPresentationSessionDeletableFileSize(sessionArgs));
    fileStatusEl = (<span>
      <Button bsStyle="danger" onClick={clickDeletePresentationSessionFiles}>
        Delete {deletableFileCount} files ({totalSize})
      </Button>
    </span>);
  }

  const isUploadMode = isPresentationUploadMode(sessionArgs);
  if (isUploadMode) {
    const { sessionId } = sessionArgs;
    const queueArgs = { queueId: sessionId };
    const isUploading = isVideoUploadQueueRunning(queueArgs);

    if (isUploading) {
      const remainCount = videoUploadQueueRemainingCount(queueArgs);
      const totalCount = videoUploadQueueTotalCount(queueArgs);
      const doneCount = totalCount - remainCount;
      queueStatusEl = (<F>
        <span>{doneCount}/{totalCount}</span>
      </F>);
    }


    const uploadReadyCount = getUploadReadyPresentationCount(sessionArgs);
    queueControls = (<F>
      <Button bsStyle="info" disabled={!gapiIsAuthenticated || isUploading || !uploadReadyCount}
        onClick={clickStartUploadPresentationSession} >
        Upload <FAIcon name="upload" /> ({uploadReadyCount})
      </Button>
      <YtStatusPanel />
    </F>);
  }

  toggleModeButton = (<F>
    <Button bsStyle="info" onClick={clickTogglePresentationUploadMode} active={isUploadMode}>
      <FAIcon name="upload" color={isUploadMode && 'lightgreen' || ''} /> <FAIcon name="youtube" size="1.4em" color="red" />
    </Button>
  </F>);
  return (<F>
    {fileStatusEl}
    {queueStatusEl}
    {queueControls}
    {toggleModeButton}
  </F>);
});

/**
 * Shown on top of the table
 */
const SessionToolbar = dataBind({})(function SessionHeader(
  sessionArgs,
  { isPresentationSessionOperator },
  { isCurrentUserAdmin }
) {
  let controlEls;
  const isOperator = isPresentationSessionOperator(sessionArgs);

  if (isCurrentUserAdmin || isOperator) {
    const { sessionId } = sessionArgs;
    controlEls = <UploadQueueControlPanel sessionId={sessionId} />;
  }

  return (<Flexbox className="full-width" alignItems="center">
    <Flexbox className="full-width" justifyContent="flex-start">
    </Flexbox>
    <Flexbox justifyContent="flex-end" alignItems="center" className="spaced-inline-children">
      {controlEls}
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
  sessionArgs,
  { isPresentationSessionInProgress, startStreaming },
  { isCurrentUserAdmin }
) {
  let introEl;
  const { sessionId } = sessionArgs;
  const canStartStreaming = (
    isCurrentUserAdmin && !isPresentationSessionInProgress(sessionArgs)
  );
  if (canStartStreaming) {
    introEl = <MediaPrepView streamId={sessionId} startStreaming={startStreaming} />;
    //introEl = (<Button bsStyle="danger" bsSize="large" onClick={clickStartStreaming} block>Start streaming!</Button>);
  }
  return (<F>
    <SessionToolbar sessionId={sessionId} />
    {introEl}
  </F>);
});

@dataBind()
class DraggableRow extends Component {
  state = {};

  // _rebuildDraggableChildFactory = () => {
  //   // NOTE: this is stupid design by the DnD plugin...
  //   //    The function must be supplied as child, however will only ever be called once, that's horrible!
  //   //    That means if anything changed, we need to re-build the function so it passes non-stale props.
  //   return 
  // }

  // getDerivedStateFromProps(nextProps) {
  //   if ((!this.state || !this.state.draggableChildFactory) || 
  //     !shallowEqual(nextProps, this.props)
  //   ) {
  //     return {
  //       draggableChildFactory: this._rebuildDraggableChildFactory()
  //     };
  //   }
  // }

  render() {
    const {
      presentationId,
      i
    } = this.props;

    return (
      <Draggable draggableId={presentationId} index={i}>
        {
          (dragProvided, draggingSnapshot) => {
            const {
              presentationId, isSelected, selectRow
            } = this.props;

            const rowProps = {
              presentationId, isSelected, selectRow,
              draggingSnapshot, dragProvided
            };
            return (<PresentationRow {...rowProps} />);
          }
        }
        {/* {this.state.draggableChildFactory} */}
      </Draggable>
    );
  }
}

@dataBind({})
class TableBody extends Component {
  state = {};

  constructor(args) {
    super(args);
  }

  selectRow = (id) => {
    const { selectedPresentationId } = this.state;
    if (selectedPresentationId === id) {
      id = null;
    }
    this.setState({ selectedPresentationId: id });
  }
  
  render(
    args,
    { isPresentationSessionOperator,
      nonPendingPresentations, pendingPresentations },
    { isPresentEditMode }
  ) {
    const { sessionId, pendingRows } = args;
    const sessionArgs = { sessionId };
    const canBeDraggable = pendingRows;

    let presentations;
    let RowComp;
    if (!pendingRows) {
      // finished presentations are fixed
      presentations = nonPendingPresentations(sessionArgs);
      RowComp = PresentationRow;
    }
    else {
      // pending rows can be dragged
      const isOperator = isPresentationSessionOperator(sessionArgs);
      const canDrag = isPresentEditMode || isOperator;
      presentations = pendingPresentations(sessionArgs);
      RowComp = canDrag ? DraggableRow : PresentationRow;
      //RowComp = PresentationRow;
    }

    const { selectedPresentationId } = this.state;
    const droppableProvided = getOptionalArgument(args, 'droppableProvided');
    const onTBodyRef = getOptionalArgument(args, 'onTBodyRef');

    return (<TBody
      innerRef={onTBodyRef}
      {...(droppableProvided && droppableProvided.droppableProps || EmptyObject)}
    >
      {
        map(presentations, (p, i) => (
          <RowComp key={p.id} presentationId={p.id}
            i={i}
            isSelected={selectedPresentationId === p.id}
            selectRow={this.selectRow} />
        ))
      }
    </TBody>);
  }
}

@dataBind({
  async setPresentationIndex(
    { presentationId, i, direction },
    { sessionId },
    { set_presentationIndex, fixPresentationSessionOrder, pendingPresentations }
  ) {
    const presentationArgs = { presentationId };

    // WARNING: the given i is the index within the pendingPresentations array.
    //    We need to add the base index of that set to get the right actual index.
    // Also:
    //    if we move up, we want a smaller number than the target index (so we subtract a small delta).
    //    if we move down, we want a bigger number than the target index (so we add a small delta).
    const ps = pendingPresentations({ sessionId });
    const p0 = ps[0];
    const index = i + p0.index + direction * 0.001;
    console.log(index, direction);

    set_presentationIndex(presentationArgs, index);
    return await fixPresentationSessionOrder({ sessionId });
  }
})
export default class PresentationsSessionTable extends Component {
  state = {};

  onTBodyRef = (ref) => {
    this.tbodyRef = ref;
    this.droppableProvided.innerRef(ref);
  }

  onDragEnd = (result) => {
    if (!result.destination || result.destination.index === result.source.index) {
      return;
    }

    const presentationId = result.draggableId;
    const i = result.destination.index;
    const direction = result.destination.index - result.source.index;
    this.props.setPresentationIndex({
      presentationId,
      i,
      direction: direction / Math.abs(direction)
    });
  }

  renderFixedRows() {
    const { sessionId } = this.props;
    return (<TableBody pendingRows={false} sessionId={sessionId} />);
  }

  // WARNING: droppableChildFactory will generally only be called once
  //      -> so don't put anything in that you want to change over time!
  droppableChildFactory = (droppableProvided) => {
    const { sessionId } = this.props;
    this.droppableProvided = droppableProvided;

    return (<TableBody pendingRows={true} sessionId={sessionId}
      droppableProvided={this.droppableProvided}
      onTBodyRef={this.onTBodyRef} />);
  }

  render(
    { sessionId },
    { get_presentations, isPresentationSessionOperator }
  ) {
    const sessionArgs = { sessionId };
    if (!get_presentations.isLoaded(sessionArgs)) {
      return <LoadIndicator block />;
    }

    const isOperator = isPresentationSessionOperator(sessionArgs);

    return (<F>
      <SessionHeader sessionId={sessionId} />

      <StyledTable condensed hover className="no-margin">
        <thead>
          <tr>
            {/* index */}
            <th className="min">#</th>
            {/* status */}
            <th className="min"></th>
            {/* operator buttons */}
            {isOperator && <th className="min"></th>}
            <th>誰？</th>
            <th>主題</th>
            {/* <th className="min">專案狀態</th> */}
          </tr>
        </thead>

        {this.renderFixedRows()}

        <DragDropContext onDragEnd={this.onDragEnd}>
          <Droppable droppableId="da-table">
            {this.droppableChildFactory}
          </Droppable>
        </DragDropContext>
      </StyledTable>
    </F >);
  }
}
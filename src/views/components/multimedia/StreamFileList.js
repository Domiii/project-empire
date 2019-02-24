import map from 'lodash/map';
import size from 'lodash/size';
import isEqual from 'lodash/isEqual';

import fs from 'bro-fs';
import moment from 'moment';
import filesize from 'filesize';


import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { dataBind } from 'dbdi/react';

import FAIcon from 'src/views/components/util/FAIcon';
import LoadIndicator from 'src/views/components/util/LoadIndicator';

import {
  Alert, Button, Jumbotron, Well, Panel
} from 'react-bootstrap';
import Moment from 'react-moment';
import Flexbox from 'flexbox-react';

import FancyPanelToggleTitle from 'src/views/components/util/FancyPanelToggleTitle';

import VideoPlayer from './VideoPlayer';
import VideoUploadPanel from './VideoUploadPanel';


const renderSize = filesize.partial({
  base: 10,
  round: 2
});


@dataBind({
  clickDelete(evt, { fileId }, { streamFileDelete }) {
    evt.preventDefault();
    return streamFileDelete({ fileId });
  }
})
export class StreamFilePanelHeader extends Component {
  toggleView = () => {
  }

  render(
    { },
    { streamFileSize, streamFileLastModified, clickDelete }
  ) {
    const { fileId, isSelected } = this.props;
    const fileArgs = { fileId };
    const size = streamFileSize(fileArgs) || 0;
    const lastModified = streamFileLastModified(fileArgs);

    //return (<HashLink smooth to={link}>
    return (<Flexbox justifyContent="space-between" alignItems="center">
      <Flexbox>
        <FancyPanelToggleTitle compressed>
          <Flexbox justifyContent="flex-start" alignItems="center">
            <span className="spaced-inline-children">
              <span className="color-gray">
                (untitled recording) [{fileId}]
              </span>
              <span>
                {renderSize(size)}
              </span>
              <span>
                [<Moment fromNow>{lastModified}</Moment> (
                <Moment format="MMMM Do YYYY, hh:mm:ss">{lastModified}</Moment>)]
              </span>
            </span>
          </Flexbox>
        </FancyPanelToggleTitle>
      </Flexbox>
      <Flexbox>
        <Button bsStyle="danger" onClick={clickDelete}>
          <FAIcon name="trash" />
        </Button>
      </Flexbox>
    </Flexbox>);
    //</HashLink>);
  }
}

@dataBind({})
export class VideoFilePreview extends Component {
  state = {
    isPreviewing: false
  };

  constructor(...args) {
    super(...args);

    // this.dataBindMethods(
    //   ''
    // );
  }

  togglePreview = () => {
    this.setState({ isPreviewing: !this.state.isPreviewing });
  }

  render(
    { },
    { get_streamFileUrl }
  ) {
    const { fileId } = this.props;
    const { isPreviewing } = this.state;
    if (!isPreviewing) {
      return (<Button bsStyle="primary" onClick={this.togglePreview} className="">
        Preview <FAIcon name="play" />
      </Button>);
    }
    else {
      const src = get_streamFileUrl({ fileId });
      if (!src) {
        return <LoadIndicator message="loading file..." />;
      }

      const replayVideoProps = {
        autoplay: true,
        controls: true,
        loop: false,
        muted: false,
        inactivityTimeout: 0, // never hide controls
        src: {
          src,
          type: 'video/webm'
        },
        stop: this.togglePreview
      };
      return (
        <VideoPlayer className="media-panel-video" {...replayVideoProps} />
      );
    }
  }
}

@dataBind({})
export class StreamFilePanel extends Component {
  toggleSelectThis = () => {
    const { fileId, onSelect, isSelected } = this.props;
    onSelect && onSelect(isSelected ? null : fileId);
  }

  render(
  ) {
    const { fileId, isSelected } = this.props;

    let className;
    let contentEl;

    if (isSelected) {
      className = 'yellow-highlight-border';
      contentEl = (<div>
        <Flexbox justifyContent="center" alignItems="center" >
          <Flexbox>
            <VideoFilePreview fileId={fileId} />
          </Flexbox>
          <Flexbox className="full-width">
            <VideoUploadPanel fileId={fileId} />
          </Flexbox>
        </Flexbox>
      </div>);
    }
    else {
      className = 'no-highlight-border';
      contentEl = null;
    }

    return (<Panel className={'no-margin ' + className}
      expanded={isSelected} onToggle={this.toggleSelectThis}>
      <Panel.Heading className="no-padding">
        <StreamFilePanelHeader fileId={fileId} isSelected={isSelected} />
      </Panel.Heading>
      <Panel.Body collapsible>
        {contentEl}
      </Panel.Body>
    </Panel>);
  }
}



@dataBind({})
export default class StreamFileList extends Component {
  constructor(...args) {
    super(...args);
    this.state = {
      expanded: false,
      quota: null
    };
  }

  toggleExpand = () => {
    const { expanded } = this.state;
    this.setState({ expanded: !expanded });
  }

  onSelect = (fileId) => {
    this.setState({ selectedId: fileId });
  }

  refresh = () => {
    //const quota = await fs.usage();
    window.navigator.webkitPersistentStorage.queryUsageAndQuota((usedBytes, grantedBytes) => {
      const quota = { usedBytes, grantedBytes };
      if (!isEqual(quota, this.state.quota)) {
        this.setState({ quota });
      }
    });
  }

  componentDidMount() {
    this.refresh();
  }

  render(
    { },
    { },
    { orderedStreamFileList }
  ) {
    if (!orderedStreamFileList) {
      return <LoadIndicator />;
    }

    this.refresh();

    const { expanded, selectedId, quota } = this.state;

    let quotaInfo;
    if (quota) {
      const { usedBytes, grantedBytes } = quota;
      const quotaPct = Math.round(usedBytes / grantedBytes * 100);
      quotaInfo = `- ${filesize(usedBytes)} / ${filesize(grantedBytes)} used (${quotaPct}%)`;
    }

    const fileEls = expanded && map(orderedStreamFileList, file =>
      (<StreamFilePanel key={file.name} fileId={file.name} isSelected={selectedId === file.name}
        onSelect={this.onSelect} />)
    );

    return (<Panel expanded={expanded} onToggle={this.toggleExpand}>
      <Panel.Heading>
        <FancyPanelToggleTitle>
          {size(orderedStreamFileList)} Saved Files {quotaInfo}
        </FancyPanelToggleTitle>
      </Panel.Heading>
      <Panel.Body collapsible>
        {fileEls}
      </Panel.Body>
    </Panel>);
  }
}
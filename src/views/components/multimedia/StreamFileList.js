import map from 'lodash/map';
import size from 'lodash/size';
import isEqual from 'lodash/isEqual';

import fs from 'bro-fs';
import moment from 'moment';
import filesize from 'filesize';


import React, { Component } from 'react';
import PropTypes from 'prop-types';
import dataBind from 'src/dbdi/react/dataBind';

import FAIcon from 'src/views/components/util/FAIcon';
import LoadIndicator from 'src/views/components/util/loading';

import {
  Alert, Button, Jumbotron, Well, Panel
} from 'react-bootstrap';

import Flexbox from 'flexbox-react';

import FancyPanelToggleTitle from 'src/views/components/util/FancyPanelToggleTitle';


const renderSize = filesize.partial({
  base: 10,
  round: 0
});


@dataBind({})
export class StreamFilePanelHeader extends Component {
  toggleView = () => {
  }

  render(
    { },
    { }
  ) {
    const { fileId, isSelected } = this.props;

    //return (<HashLink smooth to={link}>
    return (<FancyPanelToggleTitle>
      <Flexbox className="full-width" justifyContent="space-between" alignItems="center">
        <span className="color-gray">(untitled recording)</span>&nbsp;

      </Flexbox>
    </FancyPanelToggleTitle>);
    //</HashLink>);
  }
}

@dataBind({})
export class StreamFilePanel extends Component {
  selectThis = () => {
    const { fileId, onSelect } = this.props;
    onSelect && onSelect(fileId);
  }

  render(
  ) {
    const { fileId, isSelected } = this.props;
    const className = isSelected && 'yellow-highlight-border' || 'no-highlight-border';
    const contentEl = isSelected && 'TODO: add ability to tag/stream/download/preview etc';

    return (<Panel className={'no-margin ' + className}>
      <Panel.Heading className="no-padding" onClick={this.selectThis} >
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
    { streamFileList }
  ) {
    if (!streamFileList) {
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

    const fileEls = expanded && map(streamFileList, file =>
      <StreamFilePanel key={file.name} fileId={file.name} isSelected={selectedId === file.name} onSelect={this.onSelect} />
    );

    return (<Panel expanded={expanded} onToggle={this.toggleExpand}>
      <Panel.Heading>
        <FancyPanelToggleTitle>
          {size(streamFileList)} Saved Files {quotaInfo}
        </FancyPanelToggleTitle>
      </Panel.Heading>
      <Panel.Body collapsible>
        {fileEls}
      </Panel.Body>
    </Panel>);
  }
}
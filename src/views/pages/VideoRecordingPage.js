import React, { Component } from 'react';
import PropTypes from 'prop-types';
import dataBind from 'src/dbdi/react/dataBind';

import {
  Alert, Button, Jumbotron, Well, Panel, FormControl
} from 'react-bootstrap';

import {
  LinkContainer
} from 'react-router-bootstrap';

import MediaStreamPanel from 'src/views/components/multimedia/MediaStreamPanel';
import StreamFileList from 'src/views/components/multimedia/StreamFileList';


const streamArgs = {
  streamId: 1
};

@dataBind({})
export default class VideoRecordingPage extends Component {
  static propTypes = {
    projectIds: PropTypes.object
  };

  state = {
    fileId: 'TEST'
  };

  constructor(...args) {
    super(...args);

    this.dataBindMethods(
      'componentDidMount'
    );
  }

  componentDidMount(
    { },
    { set_streamFileId }
  ) {
    set_streamFileId(streamArgs, this.state.fileId);
  }

  render() {
    //{ this.IsGuardian && this.makeGuardianEl() }
    return (
      <div className="container">
        <MediaStreamPanel streamArgs={streamArgs} />
        <br />
        <br />
        <StreamFileList />
      </div>
    );
  }
}
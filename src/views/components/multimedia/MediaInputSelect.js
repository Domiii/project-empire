import map from 'lodash/map';
import filter from 'lodash/filter';

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import dataBind from 'src/dbdi/react/dataBind';
import { getOptionalArgument } from 'src/dbdi/dataAccessUtil';

import FAIcon from 'src/views/components/util/FAIcon';
import LoadIndicator from 'src/views/components/util/LoadIndicator';

import filesize from 'filesize';

import {
  Alert, Button, Jumbotron, Well, Panel
} from 'react-bootstrap';

import Flexbox from 'flexbox-react';
import Select from 'react-select';
import { NOT_LOADED } from '../../../dbdi/react';
import { Promise } from 'firebase';

const validDeviceIdRegex = /[0-9A-Fa-f]{6}/g;

function selectByKind(kind, videoinput, audioinput) {
  switch (kind) {
    case 'videoinput':
      return videoinput;
    case 'audioinput':
      return audioinput;
    default:
      return null;
  }
}


function getStream(constraints) {
  return window.navigator.mediaDevices.getUserMedia(constraints)
    .then(mediaStream => {
      return mediaStream;
    })
    .catch(err => {
      throw new Error('Could not get stream - ' + (err.stack || err));
    }); // always check for errors at the end.
}

function queryUnknownDevices(kind) {
  return getDeviceList(kind).then(list => {
    list = filter(list, info => !info.label);
    const promises = map(list, info => {
      const type = selectByKind(info.kind, 'video', 'audio');
      const { deviceId } = info;

      const constraints = {
        [type]: {
          deviceId
        }
      };

      // open stream to request permission to show the label
      return getStream(constraints);
    });

    // query all devices again, after they have all been resolved
    return Promise.all(promises).then((streams) => {
      // shutdown all streams again
      streams.forEach(stream => stream && stream.getTracks().forEach(track => track.stop()));

      return getDeviceList(kind);
    });
  });
}

function getDeviceList(kind) {
  return window.navigator.mediaDevices.enumerateDevices().then(
    list => filter(list, info => 
      info.kind === kind &&
      (!info.deviceId || validDeviceIdRegex.test(info.deviceId)))
  );
}

function getMediaSelectOptions(kind) {
  return getDeviceList(kind).then((list) => {
    let hasUnkownDevices = false;
    const options = map(list, info => ({
      value: info.deviceId,
      label: info.label || (hasUnkownDevices = true && (<span className="color-gray">
        (裝置的名字被隱藏)
        <FAIcon name="user-secret" /><FAIcon name="lock" />
      </span>))
    }));

    return {
      options,
      hasUnkownDevices
    };
  });
}

@dataBind({
  onSelectionChanged(option,
    args,
    { set_videoDeviceId, set_audioDeviceId }
  ) {
    const { kind } = args;
    const onChange = getOptionalArgument(args, 'onChange');

    const action = selectByKind(kind, set_videoDeviceId, set_audioDeviceId);

    let deviceId = option && option.value;
    action && action(deviceId);
    onChange && onChange(deviceId);
  }
})
export default class MediaInputSelect extends Component {
  static propTypes = {
    kind: PropTypes.string.isRequired,
    onChange: PropTypes.func,
    disabled: PropTypes.bool
  };

  constructor(...args) {
    super(...args);

    this.state = { options: NOT_LOADED };

    this.dataBindMethods(
      'refresh'
    );
  }

  componentDidMount() {
    this.refresh();
  }
  
  refresh = (
    { },
    { onSelectionChanged },
    { }
  ) => {
    if (this.state.options) {
      this.setState({ options: NOT_LOADED });
    }

    const {
      kind
    } = this.props;
    // generate options from media device list
    // see: https://developer.mozilla.org/en-US/docs/Web/API/MediaDeviceInfo
    getMediaSelectOptions(kind).then(({
      options,
      hasUnkownDevices
    }) => {
      const wasLoaded = this.state.options !== NOT_LOADED;
      const hasDevices = !!options.length;
      const defaultDeviceInfo = options[0];

      if (hasDevices) {
        // add "no selection"
        options.unshift({
          value: null,
          label: <span>clear <FAIcon color="red" name="times" /></span>
        });
      }

      if (!wasLoaded && hasDevices) {
        // select the first by default
        onSelectionChanged(defaultDeviceInfo);
      }

      // update state
      this.setState({ 
        options, 
        hasUnkownDevices
      });
    });
  }

  clickQueryUnknownDevices = (evt) => {
    const {
      kind
    } = this.props;

    return queryUnknownDevices(kind).then(list => {
      this.refresh();
    });
  }

  clickRefresh = evt => {
    this.refresh();
  }

  render(
    { kind },
    { onSelectionChanged, get_videoDeviceId, get_audioDeviceId },
    { }
  ) {
    const { disabled } = this.props;
    const { options, hasUnkownDevices } = this.state;

    if (options === NOT_LOADED) {
      return <LoadIndicator block message="" />;
    }

    const getter = selectByKind(kind, get_videoDeviceId, get_audioDeviceId);

    if (!getter) {
      return <Alert bsStyle="danger">[INTERNAL ERROR] invalid kind: {kind}</Alert>;
    }

    const placeholder = options.length ? <i>(no {kind} selected)</i> : <i>(no {kind} available)</i>;

    return (<Flexbox className="full-width">
      <Flexbox className="full-width">
        <Select className="full-width"
          value={getter()}
          placeholder={placeholder}
          options={options}
          onChange={onSelectionChanged}
          disabled={disabled}
        />
      </Flexbox>
      {hasUnkownDevices && (<Flexbox>
        <Button bsStyle="success" onClick={this.clickQueryUnknownDevices}>
          <FAIcon name="unlock" /> 顯示所有裝置的名字
        </Button>
      </Flexbox>) }
      {!hasUnkownDevices && !disabled && (<Flexbox>
        <Button bsStyle="primary" onClick={this.clickRefresh}>
          <FAIcon name="refresh" />
        </Button>
      </Flexbox>)}
    </Flexbox>);
  }
}
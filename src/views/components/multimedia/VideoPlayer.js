import React from 'react';
import videojs from 'video.js';


const Button = videojs.getComponent('Button');

function makeRefreshButton(refresh) {
  class RefreshButton extends Button {
    constructor(...args) {
      super(...args);

      this.addClass('fa');
      this.addClass('fa-refresh');
      this.controlText('Refresh');
    }

    handleClick(e) {
      refresh(e);

      // see: https://stackoverflow.com/a/28583639
      this.player_.pause();
      this.player_.currentTime(0);
      this.player_.trigger('loadstart');
    }
  }
  return RefreshButton;
}

/**
 * Default solution for wrapping Video.js as a react component
 * 
 * @see https://github.com/videojs/video.js
 */
export default class VideoPlayer extends React.Component {
  /**
   * @see https://codepen.io/onigetoc/pen/wJRyvZ
   */
  _initVideoJs = () => {
    // https://github.com/brightcove/videojs-playlist/blob/master/docs/api.md

    if (!this.videoEl) return;

    const { src, ...options } = this.props;
    if (src) {
      options.sources = [src];
    }

    this.player = videojs(this.videoEl, options, () => {
      console.log('onPlayerReady', this);

      const player = this.player;
      
      this.player.on('error', () => {
      });

      // ugly hack, because the default media source elements change duration only after a long period of time (at least on Chrome)
      this.player.on('durationchange', () => {
        console.warn(player.duration());
        const { duration } = this.props;
        if (player.duration() === Infinity) {
          player.duration(duration);
        }
      });

      const { refresh } = this.props;
      if (refresh) {
        // Register the new component
        videojs.registerComponent('RefreshButton', makeRefreshButton(refresh));
        //player.getChild('controlBar').addChild('SharingButton', {});
        player.getChild('controlBar').addChild('RefreshButton', {});
      }
    });
  }

  onVideoDOMReady = (videoEl) => {
    this.videoEl = videoEl;
    this._initVideoJs();
  }

  componentDidMount() {
  }

  componentWillReceiveProps(nextProps) {
    const { src } = this.props;
    const newSource = nextProps.src;
    const { player } = this;
    if (player && (!!src !== !!newSource || (src && src.src !== newSource.src))) {
      player.src(newSource);
    }
    this.setState({});
  }

  // destroy player on unmount
  componentWillUnmount() {
    if (this.player) {
      this.player.dispose();
    }
  }

  // wrap the player in a div with a `data-vjs-player` attribute
  // so videojs won't create additional wrapper in the DOM
  // see https://github.com/videojs/video.js/pull/3856
  render() {
    return (
      <div data-vjs-player>
        <video ref={this.onVideoDOMReady} className="video-js"></video>
      </div>
    );
  }
}
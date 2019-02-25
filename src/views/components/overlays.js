import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import FAIcon from 'src/views/components/util/FAIcon';

export class Overlay extends PureComponent {
  static propTypes = {
    className: PropTypes.string,
    contents: PropTypes.element
  };

  render() {
    const { contents, className } = this.props;
    const screenClasses = 'overlay-screen full-height ' + (className || '');

    return (
      <div className="overlay color-gray">
        <div className={ screenClasses }>
          { contents }
        </div>
      </div>
    );
  }
}


// TODO: move to loading.js
export class LoadOverlay extends PureComponent {
  static propTypes = {
    className: PropTypes.string,
    contents: PropTypes.element,
    message: PropTypes.string
  };

  get DefaultMessage() {
    return 'loading...';
  }

  DefaultContents(message) {
    if (message === undefined) {
      message = this.DefaultMessage;
    }
    return (<div>
      <p>{ message }</p>
      <p>
        <FAIcon name="cog" spinning={true} />
      </p>
    </div>);
  }

  render() {
    let { message, contents, className } = this.props;
    contents = contents || this.DefaultContents(message);

    return (
      <Overlay contents={contents} className={className} />
    );
  }
}
import React, { PureComponent, PropTypes } from 'react';
import { FAIcon } from 'src/views/components/util';

export class Overlay extends PureComponent {
  static propTypes = {
    contents: PropTypes.element
  };

  render() {
    const { contents, className } = this.props;
    const screenClasses = "overlay-screen max-height " + (className || '');

    return (
      <div className="overlay color-gray">
        <div className={ screenClasses }>
          { contents }
        </div>
      </div>
    );
  }
}


// TODO: load symbol -> inline + block
export class LoadSymbol extends PureComponent {

}

export class LoadOverlay extends PureComponent {
  static propTypes = {
    message: PropTypes.string,
    contents: PropTypes.element
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
        <FAIcon name="cog" spinning={true}/>
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
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { FAIcon } from 'src/views/components/util';

// TODO: load symbol -> inline + block
export default class Loading extends PureComponent {
  static propTypes = {
    block: PropTypes.bool,
    message: PropTypes.string
  };

  get DefaultMessage() {
    return 'loading...';
  }

  render() {
    let {
      message,
      block
     } = this.props;

    if (message === undefined) {
      message = this.DefaultMessage;
    }
    const classNames = 'loading' + (block && ' loading-block');
    return (<div className={classNames}>
      <span>{ message }</span>&nbsp;<FAIcon name="cog" spinning={true} />
    </div>);
  }
}
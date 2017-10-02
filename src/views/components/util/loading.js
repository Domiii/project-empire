import isNumber from 'lodash/isNumber';

import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { FAIcon } from 'src/views/components/util';


export default class LoadIndicator extends PureComponent {
  static propTypes = {
    block: PropTypes.bool,
    message: PropTypes.string,
    size: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.string
    ]),
    style: PropTypes.object
  };

  get DefaultMessage() {
    return '';
  }

  render() {
    let {
      message,
      block,
      size,
      style
     } = this.props;

    if (message === undefined) {
      message = this.DefaultMessage;
    }
    const classNames = 'loading' + (block && ' loading-block' || '');
    if (style || size) {
      style = style || {};
      if (isNumber(size)) {
        size = size + 'em';
      }
      style.fontSize = size;
    }
    return (<span style={style} className={classNames}>
      { message && (<span>{ message }&nbsp;</span>) || '' }
      <FAIcon name="cog" spinning />
    </span>);
  }
}
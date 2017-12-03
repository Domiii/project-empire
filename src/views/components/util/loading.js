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
    ])
  };

  get DefaultMessage() {
    return '';
  }

  render() {
    let {
      message,
      block,
      size,
      ...moreProps
     } = this.props;

    if (message === undefined) {
      message = this.DefaultMessage;
    }

    const style = Object.assign({}, moreProps.style);
    let clazz = moreProps.className || '';
    clazz += ' loading' + (block && ' loading-block' || '');
  
    if (size) {
      if (isNumber(size)) {
        size = size + 'em';
      }
      style.fontSize = size;
    }
    return (<span {...moreProps} style={style} className={clazz}>
      { message && (<span>{ message }&nbsp;</span>) || '' }
      <FAIcon name="cog" spinning />
    </span>);
  }
}
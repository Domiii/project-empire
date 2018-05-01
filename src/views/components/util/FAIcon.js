import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

// Online demo: https://codepen.io/Domiii/pen/mOaGWG?editors=0010
export default class FAIcon extends PureComponent {
  static propTypes = {
    name: PropTypes.string.isRequired,
    className: PropTypes.string,
    color: PropTypes.string,
    size: PropTypes.string,
    style: PropTypes.object,
    spinning: PropTypes.bool
  };

  render() {
    let {
      name, 
      className,
      color,
      size,
      style,
      spinning,
      ...moreProps
    } = this.props;

    let classes = 'fa fa-' + name + 
      (!!className && (' ' + className) || '');
    
    style = Object.assign({}, style || {});
    if (color) {
      style.color = color;
    }
    if (size) {
      style.fontSize = size;
    }

    if (spinning) {
      classes += ' fa-spin';
    }
    return (
      <i className={classes} style={style} aria-hidden="true" {...moreProps} />
    );
  }
}
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

// Online demo: https://codepen.io/Domiii/pen/mOaGWG?editors=0010
export default class FAIcon extends PureComponent {
  static propTypes = {
    className: PropTypes.string,
    color: PropTypes.string,
    name: PropTypes.string.isRequired,
    size: PropTypes.string,
    spinning: PropTypes.bool
  };

  render() {
    const {
      name, 
      className,
      color,
      size,
      spinning,
      ...childProps
    } = this.props;

    let classes = 'fa fa-' + name + 
      (!!className && (' ' + className) || '');
    
    const style = childProps.style || {};
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
      <i className={classes} style={style} aria-hidden="true" {...childProps} />
    );
  }
}
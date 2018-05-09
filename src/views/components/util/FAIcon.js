import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

const I = styled.i`
color: ${props => props.color};
font-size: ${props => props.size};
`;

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

    if (spinning) {
      classes += ' fa-spin';
    }
    return (
      <I className={classes} color={color} size={size} style={style} aria-hidden="true" {...moreProps} />
    );
  }
}
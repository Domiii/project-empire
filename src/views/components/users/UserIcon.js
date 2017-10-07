import React from 'react';
import PropTypes from 'prop-types';

const UserIconSizes = {
  tiny: '1em'
};

export default function UserIcon({user, size, ...moreProps}) {
  let style;
  let clazz = moreProps.className || '';

  clazz += ' user-icon';
  if (size) {
    style = Object.assign({}, moreProps.style);
    if (UserIconSizes[size]) {
      style.fontSize = UserIconSizes[size];
    }
    else {
      style.fontSize = size;
    }
  }
  return (<img src={user.photoURL} className={clazz} style={style} {...moreProps} />);
}
UserIcon.propTypes = {
  user: PropTypes.object.isRequired,
  size: PropTypes.string
};
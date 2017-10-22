import isNumber from 'lodash/isNumber';

import React from 'react';
import PropTypes from 'prop-types';
import ImageLoader from 'src/views/components/util/react-imageloader';
import LoadIndicator from 'src/views/components/util/loading';

function preloader() {
 return <LoadIndicator />;
}

const UserIconSizes = {
  tiny: '1em'
};

export default function UserIcon({user, size, ...moreProps}) {
  const style = Object.assign({}, moreProps.style);
  let clazz = moreProps.className || '';
  clazz += ' user-icon';
  
  if (size) {
    if (UserIconSizes[size]) {
      style.maxWidth = UserIconSizes[size];
      style.maxHeight = UserIconSizes[size];
    }
    else {
      if (isNumber(size)) {
        size = size + 'em';
      }
      style.maxWidth = size;
      style.maxHeight = size;
    }
  }
  return (
    <ImageLoader
      src={user.photoURL}
      preloader={preloader}
      className={clazz}
      style={style}>
      {user.photoURL}
    </ImageLoader>
  );
}
UserIcon.propTypes = {
  user: PropTypes.object.isRequired,
  size: PropTypes.string
};
import isNumber from 'lodash/isNumber';

import React from 'react';
import PropTypes from 'prop-types';
import dataBind from 'src/dbdi/react/dataBind';

import ImageLoader from 'src/views/components/util/react-imageloader';
import LoadIndicator from 'src/views/components/util/loading';

function preloader() {
 return <LoadIndicator />;
}

const UserIconSizes = {
  tiny: '1em',
  small: '2em',
  large: '3em',
  huge: '4em'
};

// function OuchComp() {
//   throw new Error('OUCH comp');
// }

const UserIcon = dataBind({})(function UserIcon(
  args,
  { userPublic, getProps }
) {
  let {uid, size, ...moreProps} = getProps();

  const uargs = {uid};

  const isUserLoaded = !uid || userPublic.isLoaded(uargs);
  const style = Object.assign({}, moreProps.style);
  let clazz = moreProps.className || '';
  clazz += ' user-icon';
  
  if (size === undefined) {
    size = 1.5;
  }

  if (size) {
    if (UserIconSizes[size]) {
      style.maxWidth = UserIconSizes[size];
      style.maxHeight = UserIconSizes[size];

      // make sure, it always renders the same size?
      // style.minWidth = UserIconSizes[size];
      // style.minHeight = UserIconSizes[size];
    }
    else {
      if (isNumber(size)) {
        size = size + 'em';
      }
      style.maxWidth = size;
      style.maxHeight = size;
    }
  }

  if (!isUserLoaded) {
    return <LoadIndicator className={clazz} style={style} />;
  }

  const user = userPublic(uargs);

  return (
    <ImageLoader
      src={user.photoURL}
      preloader={preloader}
      className={clazz}
      style={style}
      title={user.fullName || user.displayName}>

      {user.photoURL}
    </ImageLoader>
  );
});

UserIcon.propTypes = {
  uid: PropTypes.string.isRequired
};

export default UserIcon;
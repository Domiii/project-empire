import React, { Component } from 'react';
import PropTypes from 'prop-types';
import dataBind from 'src/dbdi/react/dataBind';
import {
  Badge
} from 'react-bootstrap';


import LoadIndicator from 'src/views/components/util/loading';
import UserIcon from './UserIcon';


@dataBind()
export default class UserBadge extends Component {
  static propTypes = {
    uid: PropTypes.string.isRequired
  }

  render({ }, { userPublic }) {
    const {
      uid,
      ...otherProps
    } = this.props;

    if (!userPublic.isLoaded({ uid })) {
      return <LoadIndicator />;
    }

    const user = userPublic({ uid });

    const clazzes = (otherProps && otherProps.className || '')
      + ' user-tag';
    const size = otherProps.size || 'tiny';

    return (<Badge style={otherProps.style} className={clazzes}>
      <UserIcon user={user} size={size} /> &nbsp;
      {user.displayName}
    </Badge>);
  }
}
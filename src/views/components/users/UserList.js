import map from 'lodash/map';

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  Badge
} from 'react-bootstrap';

import UserIcon from './UserIcon';



export class UserBadge extends Component {
  static propTypes = {
    user: PropTypes.object.isRequired,
    uid: PropTypes.string.isRequired
  }

  render() {
    const {
      user,
      ...otherProps
    } = this.props;

    const clazzes = (otherProps && otherProps.className || '')
      + ' user-tag';

    return (<Badge {...otherProps} className={clazzes}>
      <UserIcon user={user} size="tiny" /> &nbsp;
      {user.displayName}
    </Badge>);
  }
}

export default class UserList extends Component {
  static propTypes = {
    users: PropTypes.object.isRequired,
    renderUser: PropTypes.oneOfType([
      PropTypes.func,
      PropTypes.element
    ])
  };

  render() {
    let {
      users,
      renderUser
    } = this.props;

    const RenderUser = renderUser || UserBadge;

    return (<span>
      {map(users, (user, uid) => (
        !user ? null : <span key={uid}>
          { <RenderUser user={user} uid={uid} /> }&nbsp;
        </span>
      ))}
    </span>);
  }
}
import map from 'lodash/map';

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import dataBind from 'src/dbdi/react/dataBind';
import {
  Badge
} from 'react-bootstrap';


import LoadIndicator from 'src/views/components/util/loading';
import UserIcon from './UserIcon';


@dataBind()
export class UserBadge extends Component {
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

    return (<Badge style={otherProps.style} className={clazzes}>
      <UserIcon user={user} size="tiny" /> &nbsp;
      {user.displayName}
    </Badge>);
  }
}

export default class UserList extends Component {
  static propTypes = {
    uids: PropTypes.array.isRequired,
    renderUser: PropTypes.oneOfType([
      PropTypes.func,
      PropTypes.element
    ])
  };

  render() {
    let {
      uids,
      renderUser
    } = this.props;

    const RenderUser = renderUser || UserBadge;

    return (<span>
      {map(uids, (uid) => (
        <span key={uid}>
          {<RenderUser uid={uid} />} {' '}
        </span>
      ))}
    </span>);
  }
}
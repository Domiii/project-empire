import map from 'lodash/map';

import React, { Component } from 'react';
import PropTypes from 'prop-types';

import UserBadge from './UserBadge';

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
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { dataBind } from 'dbdi/react';
import {
  Alert, Badge
} from 'react-bootstrap';


import LoadIndicator from 'src/views/components/util/LoadIndicator';
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

    if (user) {
      return (<Badge style={otherProps.style} className={clazzes}>
        <UserIcon uid={uid} size={size} /> &nbsp;
        {user.fullName || user.displayName}
      </Badge>);
    }
    else {
      return (<Alert bsStyle="danger" className="inline no-margin no-padding">
        invalid user id
      </Alert>);
    }
  }
}
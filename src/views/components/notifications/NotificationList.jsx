import React, { Component, PropTypes } from 'react';
import NotificationEntry from './NotificationEntry';
import {
  ListGroup, ListGroupItem
} from 'react-bootstrap';

export default class NotificationList extends Component {
  static propTypes = {
    notifications: PropTypes.object.isRequired
  };

  render() {
    const { notifications } = this.props;

    const list = _.sortBy(notifications, notification => -notification.updatedAt);

    const entryEls = _.map(list, (notification, id) => 
      <NotificationEntry key={id + ''} {...{notification}} />
    );

    return (
      <ListGroup>
        {entryEls}
      </ListGroup>
    );
  }
}
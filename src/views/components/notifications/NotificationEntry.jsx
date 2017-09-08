import React, { Component, PropTypes } from 'react';
import Moment from 'react-moment';
import {
  ListGroup, ListGroupItem
} from 'react-bootstrap';

export default class NotificationEntry extends Component {
  static propTypes = {
    notification: PropTypes.object.isRequired
  };

  render() {
    const { 
      notification: {
        uid,
        type,
        subtype,
        updatedAt,
        args
      }
    } = this.props;

    return (
      <li className="list-group-item">
        <h4 className="list-group-item-heading">{`${type}${subtype && `/${subtype}` || ''} by ${uid}`}</h4>
        <Moment fromNow>{updatedAt}</Moment> (<Moment format="MMMM Do YYYY, h:mm:ss a">{updatedAt}</Moment>)
        <pre className="list-group-item-text">
          {JSON.stringify(args, null, 2)}
        </pre>
      </li>
    );
  }
}
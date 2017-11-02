import React, { PureComponent, } from 'react';
import PropTypes from 'prop-types';
import {
  ListGroup, ListGroupItem, Well
} from 'react-bootstrap';
import classNames from 'classnames';

export default class SubmissionEntryContent extends PureComponent {
  static propTypes = {
    text: PropTypes.string,
    hasSubmitted: PropTypes.bool
  };
  
  static contextTypes = {
    lookupLocalized: PropTypes.func.isRequired
  };

  ContentEl(text, hasSubmitted) {
    return !hasSubmitted ? null : (<pre className="list-group-item-text">
      { text }
    </pre>);
  }

  render() {
    const {
      text,
      hasSubmitted
    } = this.props;

    const classes = classNames({
      'submission-entry': true,
      'submission-entry-ready': hasSubmitted,
      'submission-entry-not-ready': !hasSubmitted
    });

    return (
      <div className={classes}>
        { this.ContentEl(text, hasSubmitted) }
      </div>
    );
  }
}
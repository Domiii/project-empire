import React, { PureComponent, PropTypes } from 'react';
import {
  ListGroup, ListGroupItem, Well
} from 'react-bootstrap';
import { Link } from 'react-router';
import { FAIcon } from 'src/views/components/util';
import classNames from 'classnames';

import { hrefConceptView } from 'src/views/href';

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
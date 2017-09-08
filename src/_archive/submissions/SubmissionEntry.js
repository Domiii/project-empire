import React, { PureComponent, PropTypes } from 'react';
import Moment from 'react-moment';
import {
  ListGroup, ListGroupItem, Well
} from 'react-bootstrap';
import { Link } from 'react-router';
import { FAIcon } from 'src/views/components/util';
import classNames from 'classnames';

import { hrefConceptView } from 'src/views/href';
import isEqual from 'lodash/isEqual';

import SubmissionEntryTitle from './SubmissionEntryTitle';
import SubmissionEntryContent from './SubmissionEntryContent';

import SubmissionFeedbackList from './SubmissionFeedbackList';

export default class SubmissionEntry extends PureComponent {
  static propTypes = {
    submissionId: PropTypes.string.isRequired,
    submission: PropTypes.object.isRequired,

    addFeedback: PropTypes.func,
    updateFeedback: PropTypes.func
  };
  
  static contextTypes = {
    lookupLocalized: PropTypes.func.isRequired
  };

  shouldComponentUpdate(nextProps, nextState) {
    return !isEqual(nextProps, this.props);
  }

  SubmissionContentEl() {
    const { 
      submission: {
        text,
        hasSubmitted
      }
    } = this.props;

    return !hasSubmitted ? null : (<pre className="list-group-item-text">
      { text }
    </pre>);
  }

  render() {
    let { 
      submissionId,
      submission,
      submission: {
        uid,
        conceptId,
        text,
        hasSubmitted,
        updatedAt
      },

      addFeedback,
      updateFeedback
    } = this.props;

    // renderCalls[submissionId] = renderCalls[submissionId] ? (renderCalls[submissionId] + 1) : 1;

    // the weird names are due to `populate` not allowing aliasing the populated object's key
    // see: https://github.com/prescottprue/react-redux-firebase/issues/126
    const user = uid;
    uid = user.uid;

    const concept = conceptId;
    conceptId = concept.conceptId;

    const classes = classNames({
      'submission-entry': true,
      'submission-entry-ready': hasSubmitted,
      'submission-entry-not-ready': !hasSubmitted
    });

    return (
      <ListGroupItem className={classes}>
        <SubmissionEntryTitle {...{
          user,
          concept,
          hasSubmitted,
          updatedAt
        }} />
        <hr />
        <div className="submission-columns">
          <SubmissionEntryContent {...{
            text,
            hasSubmitted
          }} />
          <SubmissionFeedbackList {...{
            submissionId,
            submission,
            feedback: submission.feedback,
            feedbackDetails: submission.feedbackDetails,
            addFeedback,
            updateFeedback
          }} />
        </div>
      </ListGroupItem>
    );
  }
}
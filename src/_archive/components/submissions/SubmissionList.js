import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import SubmissionEntry from './SubmissionEntry';
import SubmissionFeedbackList from './SubmissionFeedbackList';
import {
  ListGroup, ListGroupItem
} from 'react-bootstrap';

export default class SubmissionList extends PureComponent {
  static propTypes = {
    submissions: PropTypes.object.isRequired,
    addFeedback: PropTypes.func,
    updateFeedback: PropTypes.func
  };

  render() {
    const { 
      submissions,
      addFeedback,
      updateFeedback
    } = this.props;
    
    const ids = _.map(submissions, (_, id) => id);
    const sortedIds = _.sortBy(ids, id => -submissions[id].updatedAt);

    const entryEls = _.map(sortedIds, submissionId => {
      const submission = submissions[submissionId];
      return (
        <SubmissionEntry {...{
          key: submissionId,
          submissionId,
          submission,
          addFeedback,
          updateFeedback
        }} />
      );
    });

    return (
      <ListGroup>
        {entryEls}
      </ListGroup>
    );
  }
}
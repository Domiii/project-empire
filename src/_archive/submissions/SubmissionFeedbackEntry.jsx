import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';


export default class SubmissionFeedbackEntry extends PureComponent {
  static propTypes = {
    feedbackId: PropTypes.string.isRequired,
    feedback: PropTypes.object.isRequired,

    toggleEditing: PropTypes.func
  };

  render() {
    return (
      <div>
        
      </div>
    );
  }
}
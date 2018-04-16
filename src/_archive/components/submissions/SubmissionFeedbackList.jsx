// basics
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import autoBind from 'react-autobind';

// lodash
import map from 'lodash/map';
import size from 'lodash/size';

// components
import {
  ListGroup, ListGroupItem, Alert, Button
} from 'react-bootstrap';
import { FAIcon } from 'src/views/components/util';
import SubmissionFeedbackEntry from './SubmissionFeedbackEntry';
import SubmissionFeedbackForm from './SubmissionFeedbackForm';

export default class SubmissionFeedbackList extends Component {
  static contextTypes = {
    currentUserRef: PropTypes.object
  };

  static propTypes = {
    submissionId: PropTypes.string.isRequired,
    submission: PropTypes.object.isRequired,
    feedbacks: PropTypes.object,
    addFeedback: PropTypes.func,
    updateFeedback: PropTypes.func
  };

  constructor(...args) {
    super(...args);

    this.state = {
      editMode: null
    };

    autoBind(this);
  }


  // ###########################################################
  // Basic getters
  // ###########################################################

  get isAdmin() {
    const { currentUserRef } = this.context;
    return currentUserRef && currentUserRef.isAdminDisplayMode() || false;
  }

  get hasFeedback() {
    const { feedbacks } = this.props;
    return feedbacks && size(feedbacks) > 0;
  }


  // ###########################################################
  // Edit modes
  // ###########################################################

  setEditMode(mode, feedbackId) {
    this.setState({editMode: mode, feedbackId});
  }

  toggleAdding() {
    this.setEditMode(this.isAdding() && null || 'add');
  }

  toggleEditing(feedbackId) {
    if (this.isEditing(feedbackId)) {
      this.setEditMode(null);
    }
    else {
      this.setEditMode('edit', feedbackId);
    }
  }

  isAdding() {
    return this.state.editMode === 'add';
  }

  isEditing(feedbackId) {
    return this.state.editMode === 'edit' && this.state.feedbackId === feedbackId;
  }


  // ###########################################################
  // Actions
  // ###########################################################

  addFeedback({status, text}) {
    const {
      submissionId,
      submission,
      addFeedback
    } = this.props;
    const {
      conceptId, uid
    } = submission;
    
    return () => {
      const newRef = addFeedback(submissionId, conceptId, uid, status, text);
      const feedbackId = newRef.key;
      this.setEditMode(edit, feedbackId);
    };
  }

  updateFeedback({submissionId, feedbackId, status, text}) {
    const { updateFeedback } = this.props;
    return updateFeedback(submissionId, feedbackId, status, text);
  }

  // ###########################################################
  // Child elements
  // ###########################################################

  ListEl() {
    const {
      submissionId,
      feedbacks
    } = this.props;

    const els = map(feedbacks, 
      (feedback, feedbackId) => (
        <ListGroupItem key={feedbackId}>
          <SubmissionFeedbackEntry {...{
            key: feedbackId,
            feedbackId,
            feedback,

            toggleEditing: this.toggleEditing
          }}/>
          { this.EditFeedbackFormEl(submissionId, feedbackId, feedback) }
        </ListGroupItem>
      )
    );

    return (
      <ListGroup className="no-margin">
        { els }
      </ListGroup>
    );
  }

  EmptyListEl() {
    return (
      <Alert bsStyle="warning" className="no-margin">
        still waiting for feedback
      </Alert>
    );
  }

  AddFeedbackFormEl() {
    return !this.isAdding() ? null : (
      <SubmissionFeedbackForm {...{
        onSubmit: this.addFeedback,
        feedback: {}
      }} />
    );
  }

  EditFeedbackFormEl(submissionId, feedbackId, feedback) {
    return !this.isEditing(feedbackId) ? null : (
      <SubmissionFeedbackForm {...{
        onSubmit: this.updateFeedback,
        submissionId,
        feedbackId,
        feedback
      }} />
    );
  }

  AddButtonEl() { 
    return this.isAdmin && (
      <Button block
        bsSize="small"
        bsStyle="success"
        onClick={this.toggleAdding}
      >
        <FAIcon name="plus" /> add feedback
      </Button>
    );
  }


  // ###########################################################
  // render
  // ###########################################################

  render() {
    return (
      <div>
        { this.AddButtonEl() }
        { this.AddFeedbackFormEl() }
        { this.hasFeedback && this.ListEl() || this.EmptyListEl() }
      </div>
    );
  }
};
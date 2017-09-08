import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { 
  Field, reduxForm
} from 'redux-form';

import map from 'lodash/map';

import { 
  Alert, ListGroupItem, ListGroup, ButtonGroup, Button,
  OverlayTrigger, Tooltip
} from 'react-bootstrap';

import { SubmissionFeedbackStatus } from 'src/core/concepts';

const StatusSettings = {
  None: {
    bsStyle: 'default',
    icon: 'cogs',
    tooltip_en: 'Pending evaluation',
    tooltip_zh: ''
  },
  Problematic: {
    bsStyle: 'danger',
    icon: 'exclamation-circle',
    tooltip_en: 'Not quite complete yet.',
    tooltip_zh: '還不夠完整'
  },
  Ok: {
    bsStyle: 'primary',
    icon: 'check',
    tooltip_en: 'Ok... Can be better, but... Ok...',
    tooltip_zh: 'Ok... 有進步的空間，但。。。 還行啦。。。'
  },
  WellDone: {
    bsStyle: 'success',
    icon: 'heart',
    tooltip_en: 'Well done!',
    tooltip_zh: '不錯！棒！'
  }
};


export class StatusPanel extends Component {
  render() {
    const {
      value,
      onChange
    } = this.props.input;

    const buttonEls = map(StatusSettings, (settings, key) => {
      const buttonVal = SubmissionFeedbackStatus[key];
      return (
        <OverlayTrigger key={key} placement="bottom" overlay={tooltip}>
          <Button 
            bsSize="large"
            active={ value === buttonVal }
            bsStyle={ settings.bsStyle || 'default' }
            ref={ 'status-'+key }
            onClick={ () => onChange(buttonVal) }
            className="submission-feedback-status-button no-padding">
            { settings.icon && <FAIcon name={settings.icon} /> }
          </Button>
        </OverlayTrigger>
      );
    });

    return (
      <ButtonGroup className="submission-feedback-status-panel">
        { buttonEls }
      </ButtonGroup>
    );
  }
}

/*
        submissionId: 'submissionId',

        conceptId: 'conceptId',
        submitterId: 'submitterId',

        reviewerId: 'reviewerId',

        // feedback status
        status: 'status'

        text
        */
class _SubmissionFeedbackForm extends Component {
  render() {
    const { 
      handleSubmit, reset, pristine, submitting
    } = this.props;

    // actions
    function onSubmit(...args) {
      handleSubmit(...args);
      reset();
    };

    return (
      <form className="form-horizontal" onSubmit={onSubmit}>
        <Field name="submissionId" component="input" type="hidden" />
        <Field name="feedbackId" component="input" type="hidden" />

        <Field name="text" component="textarea" rows="10" style={{width: '100%'}} />

        <Field name="status" component={StatusPanel} />
      </form>
    );
  }
}


_SubmissionFeedbackForm = reduxForm({ enableReinitialize: true })(_SubmissionFeedbackForm);

const SubmissionFeedbackForm = connect(
  (state, { submissionId, feedbackId, status, text }) => {
    return ({
      form: 'feedback_' + submission.conceptId,
      initialValues: {
        submissionId,
        feedbackId,
        status,
        text
      },
    });
  }
)(_SubmissionFeedbackForm);

export default SubmissionFeedbackForm;
import { LearnerQuestionTypes } from 'src/core/scaffolding/LearnerKBModel';

import size from 'lodash/size';
import map from 'lodash/map';

import { hrefLearnerStatusList } from 'src/views/href';

import React, { Component } from 'react';
import PropTypes from 'prop-types';

import dataBind from 'src/dbdi/react/dataBind';

import Moment from 'react-moment';
import {
  Alert, Button,
  Panel,
  ListGroup, ListGroupItem
} from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import Flexbox from 'flexbox-react';

import UserBadge from 'src/views/components/users/UserBadge';
import LoadIndicator from 'src/views/components/util/loading';
import FAIcon from 'src/views/components/util/FAIcon';

import LearnerQuestionList from './LearnerQuestionList';

@dataBind({
  addQuestionClick(evt, { }, { push_learnerQuestion }) {
    const q = {
      title: 'untitled',
      description: '',
      questionType: LearnerQuestionTypes.YesNo
    };

    return push_learnerQuestion(q);
  }
})
export default class LearnerQuestionsOverview extends Component {
  constructor(...args) {
    super(...args);

    this.state = {
      editQuestionId: null
    };

    this.dataBindMethods(
      'clickAdd'
    );
  }

  clickAdd = (evt, { }, { addQuestionClick }, { }) => {
    const newRef = addQuestionClick(evt);
    this.setState({
      editQuestionId: newRef.key
    });
  }

  render(
    { },
    { },
    { }
  ) {
    return (<div>
      <h3>
        Learner Questions
      </h3>
      
      <LearnerQuestionList editQuestionId={this.state.editQuestionId} />

      <center className="full-width">
        <Button bsStyle="success" onClick={this.clickAdd}>
          <FAIcon name="plus" /> Add Question!
        </Button>
      </center>
    </div>);
  }
}
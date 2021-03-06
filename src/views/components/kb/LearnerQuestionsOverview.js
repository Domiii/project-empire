import { LearnerQuestionTypes } from 'src/core/scaffolding/LearnerKBModel';

import size from 'lodash/size';
import map from 'lodash/map';

import { hrefLearnerStatusList } from 'src/views/href';

import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { dataBind } from 'dbdi/react';

import Moment from 'react-moment';
import {
  Alert, Button,
  Panel
} from 'react-bootstrap';

import UserBadge from 'src/views/components/users/UserBadge';
import LoadIndicator from 'src/views/components/util/LoadIndicator';
import FAIcon from 'src/views/components/util/FAIcon';

import LearnerQuestionList from './LearnerQuestionList';

@dataBind({
  addQuestionClick(evt, { }, { push_learnerQuestion }) {
    const q = {
      title: '',
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
      editId: null
    };

    this.dataBindMethods(
      '_onUpdate',
      'clickAdd'
    );
  }

  componentWillMount() {
    this._onUpdate(this.props);
  }

  /**
   * This works even when we use DB data since DB data is sent via context updates.
   * see: https://github.com/facebook/react/pull/5787
   */
  componentWillReceiveProps(nextProps) {
    this._onUpdate(nextProps);
  }

  _onUpdate(nextProps,
    { },
    { },
    { learnerQuestionList }
  ) {
    // check if question has been deleted
    const {
      editId
    } = this.state;

    if (editId && (
        !learnerQuestionList ||
        !learnerQuestionList[editId]
      )) {
      this.setState({
        editId: null
      });
    }
  }

  clickAdd = (evt, { }, { addQuestionClick }, { }) => {
    const newRef = addQuestionClick(evt);
    this.setState({
      editId: newRef.key
    });
  }

  setEditing = (editId) => {
    this.setState({
      editId
    });
  }

  render(
    { },
    { },
    { learnerQuestionList }
  ) {
    return (<div>
      <h3>
        Learner Questions ({size(learnerQuestionList)})
      </h3>

      <LearnerQuestionList
        editId={this.state.editId}
        setEditing={this.setEditing}
      />

      <center className="full-width">
        {!this.state.editId &&
          <Button bsStyle="success" onClick={this.clickAdd}>
            <FAIcon name="plus" /> Add Question!
          </Button>
        }
      </center>
    </div>);
  }
}
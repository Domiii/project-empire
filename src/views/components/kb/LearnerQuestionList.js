import { LearnerQuestionTypes } from 'src/core/scaffolding/LearnerKBModel';

import size from 'lodash/size';
import map from 'lodash/map';

import { hrefLearnerStatusList } from 'src/views/href';

import React from 'react';
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

import LoadIndicator from 'src/views/components/util/loading';
import FAIcon from 'src/views/components/util/FAIcon';

import LearnerQuestionItem from './LearnerQuestionItem';



const LearnerQuestionList = dataBind({})(function LearnerQuestionsOverview(
  { editQuestionId, setEditing },
  { },
  { learnerQuestionList, learnerQuestionList_isLoaded }
) {
  if (!learnerQuestionList_isLoaded) {
    return <LoadIndicator />;
  }

  let questions = map(learnerQuestionList, (question, questionId) => ({ question, questionId }));
  // TODO: sort questions

  let contentEl;
  if (!questions.length) {
    contentEl = (<Alert bsStyle="warning">
      no questions yet
    </Alert>);
  }
  else {
    contentEl = (<ListGroup>
      {map(questions, ({ _, questionId }) => (
        <LearnerQuestionItem
          key={questionId} questionId={questionId}
          editing={editQuestionId === questionId}
          setEditing={setEditing}
        />
      ))}
    </ListGroup>);
  }
  return contentEl;
});

export default LearnerQuestionList;
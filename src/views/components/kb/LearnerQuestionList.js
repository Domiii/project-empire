import { LearnerQuestionTypes } from 'src/core/scaffolding/LearnerKBModel';

import size from 'lodash/size';
import map from 'lodash/map';

import React from 'react';
import PropTypes from 'prop-types';

import dataBind from 'src/dbdi/react/dataBind';

import {
  Alert, Button, Panel,
  ListGroup, ListGroupItem
} from 'react-bootstrap';
import Flexbox from 'flexbox-react';

import LoadIndicator from 'src/views/components/util/LoadIndicator';
import FAIcon from 'src/views/components/util/FAIcon';

import LearnerQuestionItemForm from './LearnerQuestionForm';



const LearnerQuestionList = dataBind({})(function LearnerQuestionsOverview(
  { editId, setEditing },
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
        <LearnerQuestionItemForm
          key={questionId} questionId={questionId}
          editing={editId === questionId}
          setEditing={setEditing}
        />
      ))}
    </ListGroup>);
  }
  return contentEl;
});

export default LearnerQuestionList;
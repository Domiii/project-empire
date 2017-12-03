

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



const LearnerQuestionItem = dataBind({})(function LearnerQuestionItem(
  { questionId, editing },
  { get_learnerQuestion },
  { }
) {
  if (!get_learnerQuestion.isLoaded({ questionId })) {
    return <LoadIndicator />;
  }

  const question = get_learnerQuestion({ questionId });

  return (
    <ListGroupItem header={question.title} bsStyle="info">
      { editing && 'editing' }
    </ListGroupItem>
  );
});

export default LearnerQuestionItem;
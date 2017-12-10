import { LearnerQuestionTypes } from 'src/core/scaffolding/LearnerKBModel';

import React from 'react';
import PropTypes from 'prop-types';
import dataBind from 'src/dbdi/react/dataBind';

import Moment from 'react-moment';
import {
  Alert, Button, Panel
} from 'react-bootstrap';
import Flexbox from 'flexbox-react';

import DynamicForm from 'src/views/components/forms/DynamicForm';
import FAIcon from 'src/views/components/util/FAIcon';
import LoadIndicator from 'src/views/components/util/loading';


const questionTypeKeys = Object.keys(LearnerQuestionTypes);
const questionTypeTitles = {
  Text: 'Text',
  YesNo: 'Yes/No',
  Radios: 'Radios',
  Checkboxes: 'Checkboxes'
  // [LearnerQuestionTypes.Date]: 6,
  // [LearnerQuestionTypes.Time]: 7
};


export const schemaTemplate = {
  type: 'object',
  properties: [
    {
      id: 'title',
      type: 'string',
      title: 'Title'
    },
    {
      id: 'description',
      type: 'string',
      title: 'Description',
      isOptional: true
    },
    {
      id: 'isOptional',
      title: 'Optional?',
      type: 'boolean',
      isOptional: true
    },
    {
      id: 'questionType',
      type: 'number',
      title: 'Question Type',
      enum: questionTypeKeys.map(key => LearnerQuestionTypes[key]),
      enumNames: questionTypeKeys.map(key => questionTypeTitles[key])
    },
    {
      id: 'createdAt',
      if(formData) {
        return !!formData && formData.createdAt;
      },

      'title': 'Created',
      'type': 'number'
    },
    {
      id: 'updatedAt',
      if(formData) {
        return !!formData && formData.updatedAt;
      },

      'title': 'Last Updated',
      'type': 'number'
    }
  ]
};

const uiSchema = {
  title: {
    'ui:placeholder': 'new question',
    'ui:options': {
      inline: true
    }
  },
  description: {
    'ui:options': {
      inline: true
    }
  },
  isOptional: {
    'ui:options': {
      inline: true
    }
  },
  questionType: {
    'ui:widget': 'radio',
    'ui:options': {
      inline: true
    }
  },
};

const dbName = 'learnerQuestion';

export const LearnerQuestionForm = dataBind({})(function LearnerQuestionForm(
  { questionId },
  { },
  { }
) {
  const idArgs = {
    questionId
  };
  const props = {
    schemaTemplate,
    uiSchema,

    dbName,
    idArgs
  };
  return (<DynamicForm
    {...props}
  />);
});

const LeanerQuestionHeader = dataBind({})(function LeanerQuestionHeader(
  { questionId, editing, toggleEdit },
  { get_learnerQuestion },
  { }
) {
  const question = get_learnerQuestion({ questionId });
  return question && (
    <Flexbox justifyContent="space-between" alignItems="center">
      <Flexbox>
        <h4 className={!question.title.trim() && 'color-gray' || ''}>
          {question.title || 'new question'}
        </h4>
      </Flexbox>
      <Flexbox>
        <Button onClick={toggleEdit}
          className="" bsSize="small" active={editing}>
          <FAIcon name="edit" />
        </Button>
      </Flexbox>
    </Flexbox>
  );
});

const LearnerQuestionItem = dataBind({
  toggleEdit(evt, { questionId, editing, setEditing }) {
    return setEditing(editing ? null : questionId);
  }
})(function LearnerQuestionItem(
  { questionId, editing },
  { get_learnerQuestion, toggleEdit },
  { }
) {
  if (!get_learnerQuestion.isLoaded({ questionId })) {
    return <LoadIndicator />;
  }

  const headerProps = { questionId, editing, toggleEdit };
  const formProps = { questionId };

  return (
    <Panel header={<LeanerQuestionHeader {...headerProps} />} bsStyle="info" className="no-margin">
      {editing && <LearnerQuestionForm {...formProps} />}
    </Panel>
  );
});

export default LearnerQuestionItem;
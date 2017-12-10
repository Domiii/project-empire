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
      id: 'title_en',
      type: 'string',
      title: 'Title (En)',
      isOptional: true
    },
    {
      id: 'title_zh',
      type: 'string',
      title: 'Title (中文)',
      isOptional: true
    },
    {
      id: 'description_en',
      type: 'string',
      title: 'Description (En)',
      isOptional: true
    },
    {
      id: 'description_zh',
      type: 'string',
      title: 'Description (中文)',
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
  { get_learnerQuestion, lookupLocalized },
  { }
) {
  const question = get_learnerQuestion({ questionId });
  const title = (lookupLocalized({ obj: question, prop: 'title' }) || '').trim();
  return question && (
    <Flexbox justifyContent="space-between" alignItems="center">
      <Flexbox>
        <h4 className={!title && 'color-gray' || ''}>
          {title || 'new question'}
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
    return <LoadIndicator block />;
  }

  const headerProps = { questionId, editing, toggleEdit };
  const formProps = { questionId };

  //const description = lookupLocalized({ obj: question, prop: 'description' });

  return (
    <Panel header={<LeanerQuestionHeader {...headerProps} />} bsStyle="info" className="no-margin">
      {editing && <LearnerQuestionForm {...formProps} />}
    </Panel>
  );
});

export default LearnerQuestionItem;
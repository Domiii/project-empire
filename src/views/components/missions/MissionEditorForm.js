
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


export const schemaTemplate = {
  type: 'object',
  properties: [
    {
      id: 'title_zh',
      type: 'string',
      title: 'Title (中文)',
      isOptional: true
    },
    {
      id: 'goals_zh',
      type: 'string',
      title: 'Goals (中文)',
      isOptional: true
    },
    {
      id: 'description_zh',
      type: 'string',
      title: 'Description (中文)',
      isOptional: true
    },
    {
      id: 'title_en',
      type: 'string',
      title: 'Title (EN)',
      isOptional: true
    },
    {
      id: 'goals_en',
      type: 'string',
      title: 'Goals (EN)',
      isOptional: true
    },
    {
      id: 'details_en',
      type: 'string',
      title: 'Details (EN)',
      isOptional: true
    },
    {
      id: 'description_zh',
      type: 'string',
      title: 'Description (中文)',
      isOptional: true
    },
    {
      id: 'recommendedTime',
      type: 'string',
      title: 'Recommended Time',
      isOptional: true
    },
    {
      id: 'link',
      type: 'string',
      title: 'Link',
      isOptional: true
    },
    {
      id: 'concepts',
      type: 'string',
      title: 'Concepts',
      isOptional: true
    },
    {
      id: 'isRepeatable',
      type: 'boolean',
      title: 'Repeatable?',
      isOptional: true
    },
    {
      id: 'authorName',
      type: 'string',
      title: 'Author',
      isOptional: true
    },
    {
      id: 'category',
      type: 'string',
      title: 'Category',
      isOptional: true
    },
    {
      id: 'subCategory',
      type: 'string',
      title: 'Sub Category',
      isOptional: true
    },
    {
      id: 'difficulty',
      type: 'string',
      title: 'Difficulty',
      isOptional: true
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
  title_en: {
    'ui:placeholder': 'new mission',
    'ui:options': {
      inline: true
    }
  },
  title_zh: {
    'ui:placeholder': 'new mission',
    'ui:options': {
      inline: true
    }
  },
  isRepeatable: {
    'ui:options': {
      inline: true
    }
  }
};

const dbName = 'mission';

const MissionEditorForm = dataBind({})(function MissionEditorForm(
  { missionId },
  { },
  { isCurrentUserAdmin }
) {
  if (!isCurrentUserAdmin) {
    return '';
  }
  const idArgs = {
    missionId
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


export default MissionEditorForm;
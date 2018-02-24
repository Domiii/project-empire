
// TODO: fix this!

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
import ConfirmModal from 'src/views/components/util/ConfirmModal';
import { EmptyObject } from '../../../util';


export const schemaTemplate = {
  type: 'object',
  properties: [
    {
      id: 'goalDescription',
      type: 'string',
      title: ' ',
      isOptional: false
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
  goalDescription: {
    'ui:placeholder': '很棒的新目標～',
    'ui:options': {
      inline: true
    }
  }
};

function GoalUpdateButton({ open }) {
  return (<Button bsStyle="danger" onClick={open}>
     更新這期的目標！
  </Button>);
}
GoalUpdateButton.propTypes = {
  open: PropTypes.func.isRequired
};

const GoalForm = dataBind({})(function GoalForm(
  { },
  { },
  { isCurrentUserAdmin }
) {
  if (!isCurrentUserAdmin) {
    return '';
  }

  let currentGoal,
      __doUpdate;

  // name of current goal list in model?
  const dbName = 'currentGoal';

  const props = {
    schemaTemplate,
    uiSchema,

    dbName,
    alwaysSet: true
  };

  return (<DynamicForm {...props}>
    <div>
      {currentGoal && (
        <ConfirmModal
          header="你改變了本期的目標嗎?"
          ButtonCreator={GoalUpdateButton}
          onConfirm={__doUpdate}>

          {/* { <span>{data.title}</span>} */}
        </ConfirmModal>
      ) || (
        <Button type="submit" bsStyle="success">
          存下新的目標
        </Button>
      )
      }
    </div>
  </DynamicForm>);
});


export default GoalForm;
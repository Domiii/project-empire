
import isEqual from 'lodash/isEqual';

import React, { Component } from 'react';
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
  name: 'goalData',
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
      // if(formData) {
      //   return !!formData && !!formData.createdAt;
      // },

      'title': 'Created',
      'type': 'number'
    },
    {
      id: 'updatedAt',
      // if(formData) {
      //   return !!formData && !!formData.updatedAt;
      // },

      'title': 'Last Updated',
      'type': 'number'
    }
  ]
};

const uiSchema = {
  'ui:options': {
    inline: true
  },
  goalDescription: {
    'ui:placeholder': '很棒的新目標～',
    'ui:options': {
      inline: true
    }
  },
  createdAt: {
    'ui:widget': 'hidden',
  },
  updatedAt: {
    'ui:widget': 'hidden',
  },
};


          /* {currentGoal && (
          <ConfirmModal
            header="你改變了本期的目標嗎?"
            ButtonCreator={GoalUpdateButton}
            onConfirm={__doUpdate}>

            {/* { <span>{data.title}</span>} }
          </ConfirmModal>
        ) || (
          )
        } */
// function GoalUpdateButton({ open }) {
//   return (<Button bsStyle="danger" onClick={open}>
//     更新這期的目標！
//   </Button>);
// }
// GoalUpdateButton.propTypes = {
//   open: PropTypes.func.isRequired
// };

function UpdateButtonUnsaved() {
  return (
    <Button disabled={false} type="submit" 
      bsStyle="warning">
      <FAIcon name="exclamation-triangle" /> 存！ <FAIcon name="exclamation-triangle" />
    </Button>
  );
}

function UpdateButtonSaved() {
  return (
    <Button disabled={true} type="submit" 
      bsStyle="success">
      <FAIcon name="check" /> 已存 <FAIcon name="check" />
    </Button>
  );
}

@dataBind({})
class GoalForm extends Component {
  constructor(...args) {
    super(...args);

    this.state = {
    };
  }

  onChange = ({ formData }) => {
    this.setState({ formData });
  }

  render(
    { },
    { set_currentGoal },
    { currentGoal, currentGoal_isLoaded }
  ) {
    if (!currentGoal_isLoaded) {
      return <LoadIndicator />;
    }

    // name of current goal list in model?
    const dbName = 'currentGoal';

    const latestGoal = this.state.formData && this.state.formData.goalDescription || '';
    const oldGoal = currentGoal && currentGoal.goalDescription || '';
    const isUnsaved = this.state.formData && !isEqual(latestGoal, oldGoal);

    const props = {
      schemaTemplate,
      uiSchema,

      dbName,
      writer: set_currentGoal,

      onChange: this.onChange,

      className: isUnsaved ? 'background-lightyellow' : ''
    };

    return (<div>
      <DynamicForm {...props}>
        <div>
          { isUnsaved ? <UpdateButtonUnsaved /> : <UpdateButtonSaved /> }
        </div>
      </DynamicForm>
    </div>);
  }
}


export default GoalForm;
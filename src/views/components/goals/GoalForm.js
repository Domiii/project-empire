
import {
  goalSchemaTemplate
} from 'src/core/goals/GoalModel';
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


const uiSchema = {
  'ui:options': {
    inline: false
  },
  goalTitle: {
    'ui:widget': 'text',
    'ui:placeholder': '很棒的新目標～',
    'ui:options': {
      inline: true
    }
  },
  goalDescription: {
    'ui:widget': 'textarea',
    'ui:placeholder': '有更多細節來描述這目標嗎？',
    'ui:options': {
      inline: true,
      rows: 3
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

function UpdateButtonEmpty() {
  return (
    <Button disabled={true} type="submit"
      bsStyle="danger">
      <FAIcon name="exclamation-triangle" /> 目標是空的! <FAIcon name="exclamation-triangle" />
    </Button>
  );
}

function UpdateButtonUnsaved() {
  return (
    <Button disabled={false} type="submit"
      bsStyle="warning">
      <FAIcon name="exclamation-triangle" /> 存下！ <FAIcon name="exclamation-triangle" />
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

  onStateChange = ({ formData, isSaved }) => {
    this.setState({ formData, isSaved });
  }

  render(
    { scheduleId, cycleId, uid },
    { get_goalById },
    { }
  ) {
    const goalId = {
      scheduleId, cycleId, uid
    };
    const goalQuery = { goalId };
    if (!get_goalById.isLoaded(goalQuery)) {
      return <LoadIndicator />;
    }

    const currentGoal = get_goalById(goalQuery);

    // name of current goal list in model?
    const dbName = 'goalById';

    const {
      isSaved,
      formData
    } = this.state;

    const currentTitle = formData && formData.goalTitle || '';
    const currentDescription = formData && formData.currentDescription || '';
    const oldTitle = currentGoal && currentGoal.goalTitle || '';
    const oldDescription = currentGoal && currentGoal.goalDescription || '';
    const latestTitle = formData ? currentTitle : oldTitle;
    const latestDescription = formData ? currentDescription : oldDescription;

    const isTitleEmpty = !latestTitle.trim();
    uiSchema.goalTitle.classNames = (!isSaved || isTitleEmpty) ? 'background-lightyellow' : '';
    uiSchema.goalDescription.classNames = (!isSaved || !latestDescription.trim()) ? 'background-lightyellow' : '';

    let btn;
    if (isTitleEmpty) {
      btn = <UpdateButtonEmpty />;
    }
    else if (!isSaved) {
      btn = <UpdateButtonUnsaved />;
    }
    else {
      btn = <UpdateButtonSaved />;
    }

    const props = {
      goalSchemaTemplate,
      uiSchema,

      dbName,

      onStateChange: this.onStateChange
    };

    return (<div>
      <DynamicForm {...props}>
        <div>
          {btn}
        </div>
      </DynamicForm>
    </div>);
  }
}


export default GoalForm;
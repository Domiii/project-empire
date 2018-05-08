
import isEqual from 'lodash/isEqual';

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import dataBind from 'src/dbdi/react/dataBind';

import Moment from 'react-moment';
import {
  Alert, Button, Panel
} from 'react-bootstrap';
import Flexbox from 'flexbox-react';

import DynamicForm from 'src/views/tools/DynamicForm';
import FAIcon from 'src/views/components/util/FAIcon';
import LoadIndicator from 'src/views/components/util/LoadIndicator';
import ConfirmModal from 'src/views/components/util/ConfirmModal';
import { EmptyObject } from '../../../util';


/**
 * TODO
  * Goal: Evaluate and optimize learning path, problem solving + collaboration
  * Goal: Create a proper method of (self-) evaluation of learning that can be as an objective evaluation method to replace other grading and assessment schemes?
    * Arguing on your own behalf? (Against yourself?)
    * Peers + trust?
    * (also, in many cases, needs 提交 作品集 link)
  * coachee can customize own form
  * coach can also customize everyone's form
  * coach/coachee can see/visualize own statistics
  * coach can produce overall statistics
  * coach gives feedback on things
  * coach/coachee can send follow-up questions
  
  Co-Learning System Ideas
  Feature: Checklists
  Feature: Individually customizable Checklists
  Feature: Pub-sub for "units of learning" (concepts, problems, questions etc)
    * Weekly subbing for in-class grouping
    * Point system for pub-sub
    * Problem: Everyone needs to have the most fitting version of the interpretation of the point system?
    * Problem: Points for different units have different values?
    * Problem: Gotta be able to get multiple points for performing a unit in different ways/revisiting it (e.g. finiding multiple ways to download website)
    * Problem: Point computation must become straight-forward
      * NOTEL might take a while before one realizes how well a concept is understood!
  Feature: Point collection needs to lead something more (since system usage is not open-ended and generally ends (latest) with the semester)
 */

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
      'type': 'number',
      isOptional: true
    }
  ]
};

const uiSchema = {
  'ui:options': {
    inline: true
  },
  goalDescription: {
    'ui:widget': 'textarea',
    'ui:placeholder': '很棒的新目標～',
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
export default class ReflectionForm extends Component {
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

    const dbName = 'TODO';

    // const currentInput = this.state.formData && this.state.formData.goalDescription || '';
    // const oldGoal = currentGoal && currentGoal.goalDescription || '';
    // const latestGoal = this.state.formData ? currentInput : oldGoal;
    // const isUnsaved = !isEqual(latestGoal, oldGoal);

    // const isEmpty = !latestGoal.trim();
    // uiSchema.goalDescription.classNames = isUnsaved ? 'background-lightyellow' : '';

    // let btn;
    // if (isEmpty) {
    //   btn = <UpdateButtonEmpty />;
    // }
    // else if (isUnsaved) {
    //   btn = <UpdateButtonUnsaved />;
    // }
    // else {
    //   btn = <UpdateButtonSaved />;
    // }

    const props = {
      schemaTemplate,
      uiSchema,

      dbName,
      writer: set_currentGoal,

      onChange: this.onChange
    };

    return (<div>
      <DynamicForm {...props}>
        <div>
          { btn }
        </div>
      </DynamicForm>
    </div>);
  }
}

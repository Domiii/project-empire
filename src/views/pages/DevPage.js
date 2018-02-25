import React, { Component } from 'react';
import PropTypes from 'prop-types';
import dataBind from 'src/dbdi/react/dataBind';

import {
  Alert, Button, Jumbotron, Well, Panel
} from 'react-bootstrap';

import {
  LinkContainer
} from 'react-router-bootstrap';
import { LoadOverlay } from 'src/views/components/overlays';


import DynamicForm from 'src/views/components/forms/DynamicForm';
import FAIcon from 'src/views/components/util/FAIcon';
import LoadIndicator from 'src/views/components/util/loading';


export const schemaTemplate = {
  type: 'object',
  properties: [
    {
      id: 'cycleId',
      type: 'number',
      title: 'Cycle',
      isOptional: false
    },
    {
      id: 'scheduleId',
      type: 'string'
    }
  ]
};

const uiSchema = {
  'ui:options': {
    inline: true
  },
  cycleId: {
    'ui:placeholder': '很棒的新目標～',
    'ui:options': {
      inline: true
    }
  },
  scheduleId: {
    'ui:widget': 'hidden',
  }
};

@dataBind({
  writer(
    args,
    {},
    { learnerScheduleAdjustOffsetForCycleId }
  ) {
    return learnerScheduleAdjustOffsetForCycleId(args);
  }
})
class ScheduleManipulator extends Component {
  static propTypes = {
    writer: PropTypes.func.isRequired
  };

  onChange = ({ formData }) => {
    return this.props.writer(formData);
  }

  render(
    { },
    { learnerScheduleSettings },
    { currentLearnerScheduleId,
      currentLearnerScheduleId_isLoaded }
  ) {
    if (!currentLearnerScheduleId_isLoaded) {
      return <LoadIndicator />;
    }

    const {
      writer
    } = this.props;

    const scheduleId = currentLearnerScheduleId;

    // supply scheduleId for writer
    const idArgs = {
      scheduleId
    };

    // supply scheduleId for writer
    // const formArgs = {
    //   scheduleId
    // };

    const props = {
      schemaTemplate,
      uiSchema,

      idArgs,
      reader: learnerScheduleSettings,
      writer: writer,

      onChange: this.onChange

      //formArgs
    };

    return (<DynamicForm {...props} >
      {/* no buttons! */}
      <span />
    </DynamicForm>);
  }
}


@dataBind({

})
export default class DevPage extends Component {
  constructor(...args) {
    super(...args);
  }

  render({ }, { }, { isCurrentUserDev, currentUser_isLoaded }) {
    if (!currentUser_isLoaded) {
      return (<LoadOverlay />);
    }
    if (!isCurrentUserDev) {
      return (<Alert bsStyle="warning">Devs only :/</Alert>);
    }

    return (
      <div>
        <Panel bsStyle="primary">
          <Panel.Heading>
            Schedule Settings
          </Panel.Heading>
          <Panel.Body>
            <ScheduleManipulator />
          </Panel.Body>
        </Panel>
      </div>
    );
  }
}
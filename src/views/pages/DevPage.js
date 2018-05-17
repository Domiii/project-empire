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


import DynamicForm from 'src/views/tools/DynamicForm';
import FAIcon from 'src/views/components/util/FAIcon';
import LoadIndicator from 'src/views/components/util/LoadIndicator';
import { NOT_LOADED } from '../../dbdi';


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
  updateCycleId(
    args,
    { },
    { learnerScheduleAdjustOffsetForCycleId }
  ) {
    return learnerScheduleAdjustOffsetForCycleId(args);
  }
})
class LearnerScheduleCycleForm extends Component {
  static propTypes = {
    updateCycleId: PropTypes.func.isRequired
  };

  onChange = ({ formData }) => {
    return this.props.updateCycleId(formData);
  }

  render(
    { },
    { learnerScheduleSettings },
    { currentLearnerScheduleId }
  ) {
    const scheduleId = currentLearnerScheduleId;
    if (scheduleId === NOT_LOADED) {
      return <LoadIndicator />;
    }
    if (!scheduleId) {
      return (<Alert className="no-margin no-padding" bsStyle="warning">
        no schedule
      </Alert>);
    }

    const {
      updateCycleId
    } = this.props;

    // supply scheduleId for updateCycleId
    const idArgs = {
      scheduleId
    };

    // supply scheduleId for updateCycleId
    // const formArgs = {
    //   scheduleId
    // };

    const props = {
      schemaTemplate,
      uiSchema,

      idArgs,
      reader: learnerScheduleSettings,
      writer: updateCycleId,

      onChange: this.onChange

      //formArgs
    };

    return (<DynamicForm {...props} >
      {/* no buttons! */}
      <span />
    </DynamicForm>);
  }
}


// @dataBind()
// class SessionManipulator extends Component {
//   render() {
//   }
// }

@dataBind({
  clickDeleteFileIds(evt,
    { },
    { deleteAllVideoIdsInSession },
    { livePresentationSessionId }
  ) {
    const sessionArgs = { sessionId: livePresentationSessionId };
    deleteAllVideoIdsInSession(sessionArgs);
  },
  
  clickDeleteSession(evt,
    { },
    { deletePresentationSession },
    { livePresentationSessionId }
  ) {
    const sessionArgs = { sessionId: livePresentationSessionId };
    deletePresentationSession(sessionArgs);
  }
})
class SessionsManipulator extends Component {
  render(
    { },
    { clickDeleteFileIds, clickDeleteSession },
    { livePresentationSessionId }
  ) {
    return (<div>
      <Button bsStyle="danger" disabled={!livePresentationSessionId} onClick={clickDeleteFileIds}>
        Delete all fileIds of active session
      </Button>
      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
      <Button bsStyle="danger" disabled={!livePresentationSessionId} onClick={clickDeleteSession}>
        ️⚠️ Delete live presentation session ⚠️
      </Button>
    </div>);
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

    return (<div className="container no-padding">
      <Panel bsStyle="primary">
        <Panel.Heading>
          Schedule Settings
        </Panel.Heading>
        <Panel.Body>
          <LearnerScheduleCycleForm />
        </Panel.Body>
      </Panel>
      <Panel bsStyle="primary">
        <Panel.Heading>
          Presentation Sessions
      </Panel.Heading>
        <Panel.Body>
          <SessionsManipulator />
        </Panel.Body>
      </Panel>
    </div>);
  }
}
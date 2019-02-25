import React, { Component } from 'react';
import DynamicForm from 'src/views/tools/DynamicForm';

import { dataBind } from 'dbdi/react';

import {
  Panel, Button, ListGroup, ListGroupItem, Alert, Badge
} from 'react-bootstrap';

export const schemaTemplate = {
  type: 'object',
  properties: [
    {
      id: 'name',
      type: 'string',
      isOptional: true
    },
    {
      id: 'description',
      type: 'string',
      isOptional: true
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

@dataBind({})
export default class CohortEditor extends Component {
  state = {}

  uiSchema = {
    'ui:options': {
      inline: false
    },
    name: {
      'ui:widget': 'text',
      'ui:placeholder': 'name',
      'ui:options': {
        label: false,
        inline: true
      }
    },
    description: {
      'ui:widget': 'text',
      'ui:placeholder': 'description',
      'ui:options': {
        label: false,
        inline: true
      }
    },
    createdAt: {
      'ui:widget': 'hidden',
    },
    updatedAt: {
      'ui:widget': 'hidden',
    },
  }

  onStateChange = ({ isSaved }) => {
    this.setState({ isSaved });
    //console.log('onStateChange', isSaved);
  }

  render({ cohortId }) {
    const { isSaved } = this.state;

    const { uiSchema } = this;

    const idArgs = { cohortId };
    const dbName = 'cohortsById';
    const props = {
      schemaTemplate,
      uiSchema,

      dbName,
      idArgs,

      onStateChange: this.onStateChange
    };

    return (<div>
      {/* <Badge bsStyle={isSaved && 'success' || 'info'}>
        {isSaved && 'Saved' || 'not saved'}
      </Badge> */}
      <DynamicForm {...props} />
    </div>);
  }
}
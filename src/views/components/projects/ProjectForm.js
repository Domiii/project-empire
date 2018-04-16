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

export const projectSchemaTemplate = {
  type: 'object',
  properties: [
    {
      id: 'title',
      type: 'string',
      isOptional: false
    },
    {
      id: 'description',
      type: 'string',
      isOptional: false
    },
    {
      id: 'icon',
      type: 'string',
      isOptional: false
    },
    {
      id: 'guardianUid',
      type: 'string',
      isOptional: false
    }
  ]
};


@dataBind({})
export default class ProjectForm extends Component {
  constructor(...args) {
    super(...args);

    this.state = {
    };

    this.uiSchema = {
      'ui:options': {
        inline: false
      },
      title: {
        'ui:widget': 'text',
        'ui:placeholder': '很棒的專案目標～',
        'ui:options': {
          label: false,
          inline: true
        }
      },
      description: {
        'ui:widget': 'textarea',
        'ui:placeholder': '有更多細節來描述這目標嗎？',
        'ui:options': {
          label: false,
          inline: true,
          rows: 3
        }
      },
      icon: {
        'ui:widget': 'text',
        'ui:placeholder': 'icon 的網址',
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
    };
  }

  onStateChange = ({ formData, isSaved }) => {
    this.setState({ formData, isSaved });
  }

  render(
    { projectId },
    { },
    { }
  ) {
    // name of current goal list in model?
    const dbName = 'projectById';

    // const {
    //   isSaved,
    //   formData
    // } = this.state;
    const { uiSchema } = this;
    
    //uiSchema.goalTitle.classNames = (!isSaved) ? 'background-lightyellow' : '';

    const idArgs = projectId;
    const props = {
      schemaTemplate: projectSchemaTemplate,
      uiSchema,

      dbName,
      idArgs,

      onStateChange: this.onStateChange
    };

    return (<div>
      <DynamicForm {...props}>
        {/* <div>
          {btn}
        </div> */}
      </DynamicForm>
    </div>);
  }
}
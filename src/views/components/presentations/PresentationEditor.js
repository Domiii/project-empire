import map from 'lodash/map';
import size from 'lodash/size';
import mapValues from 'lodash/mapValues';

import { EmptyObject } from '../../../util';

import React, { Component, Fragment as F } from 'react';
import { dataBind } from 'dbdi/react';
import { NOT_LOADED } from 'dbdi/util';

import {
  Button, Alert, Panel, Table
} from 'react-bootstrap';
import Moment from 'react-moment';
import styled from 'styled-components';
import Flexbox from 'flexbox-react';

import ImageLoader from 'src/views/components/util/react-imageloader';
import LoadIndicator from 'src/views/components/util/LoadIndicator';
import FAIcon from 'src/views/components/util/FAIcon';

import DynamicForm from 'src/views/tools/DynamicForm';

import { PresentationStatus } from '../../../core/presentations/PresentationModel';

export const schemaTemplate = {
  type: 'object',
  properties: [
    {
      id: 'index',
      type: 'number',
      isOptional: true
    },
    {
      id: 'title',
      type: 'string',
      isOptional: true
    },
    {
      id: 'userNamesString',
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
export default class PresentationEditor extends Component {
  uiSchema = {
    'ui:options': {
      inline: false
    },
    index: {
      'ui:widget': 'text',
      'ui:placeholder': 'index',
      'ui:options': {
        label: false,
        inline: true
      }
    },
    title: {
      'ui:widget': 'text',
      'ui:placeholder': 'title',
      'ui:options': {
        label: false,
        inline: true
      }
    },
    userNamesString: {
      'ui:widget': 'text',
      'ui:placeholder': 'userNamesString',
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

  render({ presentationId }) {
    const { uiSchema } = this;

    const idArgs = { presentationId };
    const dbName = 'presentation';
    const props = {
      schemaTemplate: schemaTemplate,
      uiSchema,

      dbName,
      idArgs,

      onStateChange: this.onStateChange
    };

    return (<div>
      <DynamicForm {...props} />
    </div>);
  }
}
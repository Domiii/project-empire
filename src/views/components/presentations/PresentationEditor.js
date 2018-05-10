import map from 'lodash/map';
import size from 'lodash/size';
import mapValues from 'lodash/mapValues';

import { EmptyObject } from '../../../util';

import React, { Component, Fragment as F } from 'react';
import dataBind, { NOT_LOADED } from '../../../dbdi/react/dataBind';

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


@dataBind({})
export default class PresentationEditor extends Component {
  uiSchema = {
    'ui:options': {
      inline: false
    },
    title: {
      TODO
      'ui:widget': 'text',
      'ui:placeholder': '很棒的新目標～',
      'ui:options': {
        label: false,
        inline: true
      }
    },
    goalDescription: {
      'ui:widget': 'textarea',
      'ui:placeholder': '有更多細節來描述這目標嗎？',
      'ui:options': {
        label: false,
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
  }

  render(
    presArgs,
    { get_presentation }
  ) {
    const { uiSchema } = this;

    const idArgs = presArgs;
    const dbName = 'presentation';
    const props = {
      schemaTemplate: goalSchemaTemplate,
      uiSchema,

      dbName,
      idArgs,

      onStateChange: this.onStateChange
    };
    const presentation = get_presentation(presArgs);
    const { sessionId } = presentation;
    return (<div>
      <DynamicForm {...props} />
    </div>);
  }
}
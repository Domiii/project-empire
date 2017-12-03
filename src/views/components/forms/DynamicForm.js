import DynamicFormSchemaBuilder from 'src/core/forms/DynamicFormSchemaBuilder';

import merge from 'lodash/merge';
import mapValues from 'lodash/mapValues';
import map from 'lodash/map';

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Form from 'react-jsonschema-form';
import Moment from 'react-moment';

import {
  Label, Button
} from 'react-bootstrap';

import dataBind from 'src/dbdi/react/dataBind';

import Markdown from 'src/views/components/markdown';

import UserBadge from 'src/views/components/users/UserBadge';


// ###########################################################################
// FieldTemplate
// ###########################################################################

/**
 * Custom Form rendering.
 * @see https://github.com/mozilla-services/react-jsonschema-form/tree/master/src/components/fields/SchemaField.js#L92
 */
function FieldTemplate(props) {
  const {
    id,
    classNames,
    label,
    children,
    //errors,
    help,
    description,
    hidden,
    required,
    displayLabel,
  } = props;
  if (hidden) {
    return children;
  }

  return (
    <div className={classNames}>
      {displayLabel && (
        <label className="full-width" required={required} id={id} >
          {label} {description} {children}
        </label>
      )}
      {!displayLabel && children}
      {/* errors */}
      {help && help}
    </div>
  );
}
if (process.env.NODE_ENV !== 'production') {
  FieldTemplate.propTypes = {
    id: PropTypes.string,
    classNames: PropTypes.string,
    label: PropTypes.string,
    children: PropTypes.node.isRequired,
    errors: PropTypes.element,
    rawErrors: PropTypes.arrayOf(PropTypes.string),
    help: PropTypes.element,
    rawHelp: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
    description: PropTypes.element,
    rawDescription: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
    hidden: PropTypes.bool,
    required: PropTypes.bool,
    readonly: PropTypes.bool,
    displayLabel: PropTypes.bool,
    fields: PropTypes.object,
    formContext: PropTypes.object,
  };
}

FieldTemplate.defaultProps = {
  hidden: false,
  readonly: false,
  required: false,
  displayLabel: true,
};

/**
 * DescriptionField: Allow displaying markdown
 * @see https://github.com/mozilla-services/react-jsonschema-form/tree/master/src/components/fields/DescriptionField.js
 */
function DescriptionField(props) {
  const { id, description } = props;
  return (
    <Markdown id={id} className="field-description color-gray" source={description} />
  );
}


// ###########################################################################
// Default renderering
// ###########################################################################

const fields = {
  DescriptionField
};

const widgets = {
  momentTime({ value }) {
    return (!value && <span /> || <span>
      <Moment fromNow>{value}</Moment> (
        <Moment format="MMMM Do YYYY, hh:mm:ss">{value}</Moment>)
    </span>);
  },
  user({ value }) {
    return (value &&
      <UserBadge uid={value} /> ||
      <span className="color-lightgray">無</span>);
  },
  //mission: MissionSelect
};

const defaultFormRenderSettings = {
  uiSchema: {
    createdAt: {
      'ui:readonly': true,
      'ui:widget': 'momentTime'
    },
    updatedAt: {
      'ui:readonly': true,
      'ui:widget': 'momentTime'
    }
  },

  widgets,
  fields,
  liveValidate: true,
  showErrorList: false,
  FieldTemplate
  // onChange: itemLog('changed'),
  // onError: itemLog('errors'),
};

function defaultFormChildren() {
  return (<div>
    <Button block type="submit" bsStyle="info">
      完成
    </Button>
  </div>);
}

function DefaultFormRender(allProps) {
  return (<Form {...allProps}>
    {/* the Form children are the control elements, rendered at the bottom of the form */}
    {allProps.children || defaultFormChildren()}
  </Form>);
}


// ###########################################################################
// Putting it all together
// ###########################################################################


/**
 * Adds dynamicity, some default components and more features to default jsonschema forms.
 */
@dataBind({})
export default class DynamicForm extends Component {
  static propTypes = {
    formData: PropTypes.object.isRequired,
    onSubmit: PropTypes.func.isRequired
  };

  constructor(...args) {
    super(...args);
  }

  render(allArgs) {
    const [
      { },
      { getProps },
      { }
    ] = allArgs;

    let {
      component,
      
      schema,
      schemaTemplate,
      schemaBuilder,

      formData,
      onSubmit,

      ...otherProps
    } = getProps();

    const Component = component || DefaultFormRender;

    const renderSettings = merge(otherProps, defaultFormRenderSettings);

    if (schemaTemplate) {
      // template overrides builder
      schemaBuilder = new DynamicFormSchemaBuilder(schemaTemplate);
    }

    if (schemaBuilder) {
      // builder overrides schema
      schema = schemaBuilder.build(renderSettings.uiSchema, allArgs);
    }

    return (<Component
      schema={schema}

      formData={formData}
      onSubmit={onSubmit}

      {...renderSettings}
    />);
  }
}
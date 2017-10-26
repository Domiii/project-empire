import merge from 'lodash/merge';
import mapValues from 'lodash/mapValues';
import map from 'lodash/map';

import React from 'react';
import PropTypes from 'prop-types';
import Form from 'react-jsonschema-form';

import {
  Label
} from 'react-bootstrap';

import Markdown from 'src/views/components/markdown';

import partyPrepareMeeting from './partyPrepareMeeting';


const _stageFormRenderAll = {
  partyPrepareMeeting
};


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
    errors,
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
      {displayLabel && <Label label={label} required={required} id={id} />}
      {displayLabel && description ? description : null}
      {children}
      {errors}
      {help}
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
    <Markdown id={id} className="field-description" source={description} />
  );
}


// ###########################################################################
// Default renderering
// ###########################################################################

const fields = {
  DescriptionField
};

const defaultFormRenderSettings = {
  // schema: FormSchema,
  // uiSchema: FormUISchema,

  fields,
  liveValidate: true,
  showErrorList: false,
  // onChange: itemLog('changed'),
  // onError: itemLog('errors'),
  onSubmit
};

function defaultFormChildren() {
  return (<div>
    <button type="submit" className="btn btn-info">
      {alreadyExists ? 'Update' : 'Add new'}
    </button>
    {alreadyExists &&
      <ConfirmModal
        header="Confirm DELETE"
        ButtonCreator={ItemDeleteButton}
        onConfirm={doDelete}>

        <span>{data.title}</span>

      </ConfirmModal>
    }
  </div>);
}

function DefaultFormRender(allProps) {
  return (<Form {...allProps}>
    {/* the Form children are the control elements, rendered at the bottom of the form */}
    { allProps.children || defaultFormChildren() }
  </Form>);
}
DefaultFormRender.propTypes = {
  formData: PropTypes.object.isRequired
};



// ###########################################################################
// Bookkeeping
// ###########################################################################

const renderSettings = mapValues(_stageFormRenderAll, info => merge({}, info && info.settings, defaultFormRenderSettings));
const renderersRaw = mapValues(_stageFormRenderAll, info => info && info.render || DefaultFormRender);

const stageFormRenderers = map(renderersRaw, (FormRender, name) => {
  FormRender = FormRender || DefaultFormRender;
  const settings = renderSettings[name] || {};

  return (props) => (
    <FormRender
      {...settings}
      {...props}
    />
  );
});

export function getStageFormRenderer(name) {
  if (!stageFormRenderers[name]) {
    throw new Error(`Tried to get invalid StageFormRenderer "${name}"`);
  }
  return stageFormRenderers[name];
}

export default stageFormRenderers;
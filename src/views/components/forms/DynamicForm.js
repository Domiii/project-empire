import DynamicFormSchemaBuilder from 'src/core/forms/DynamicFormSchemaBuilder';

import merge from 'lodash/merge';
import mapValues from 'lodash/mapValues';
import map from 'lodash/map';
import pickBy from 'lodash/pickBy';
import isEmpty from 'lodash/isEmpty';
import omit from 'lodash/omit';

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Form from 'react-jsonschema-form';
import Moment from 'react-moment';

import {
  Label, Button
} from 'react-bootstrap';
import Flexbox from 'flexbox-react';

import dataBind, { NOT_LOADED } from 'src/dbdi/react/dataBind';
import { getOptionalArgument, getOptionalArguments } from 'src/dbdi/dataAccessUtil';

import FAIcon from 'src/views/components/util/FAIcon';
import LoadIndicator from 'src/views/components/util/loading';
import ConfirmModal from 'src/views/components/util/ConfirmModal';
import Markdown from 'src/views/components/markdown';

import UserBadge from 'src/views/components/users/UserBadge';
import { EmptyObject } from '../../../util';


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
    rawHelp,
    description,
    hidden,
    required,
    displayLabel,
  } = props;
  if (hidden) {
    return children;
  }

  return (
    <div className={classNames + ' flex-child full-width no-margin'}>
      {displayLabel && (
        <label className={'form-label full-width'} required={required} id={id} >
          {label} {description} {children}
        </label>
      )}
      {!displayLabel && children}
      {/* errors */}
      {rawHelp && help}
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


// ###########################################################################
// ObjectFieldTemplate
// see: https://github.com/mozilla-services/react-jsonschema-form/tree/master/src/components/fields/ObjectField.js#L10
// ###########################################################################

function DefaultObjectFieldTemplate(props) {
  const { TitleField, DescriptionField } = props;
  const {
    inline
  } = props.uiSchema["ui:options"] || EmptyObject;

  const content = (
    <div className="flex-child">
      {(props.uiSchema["ui:title"] || props.title) && (
        <TitleField
          id={`${props.idSchema.$id}__title`}
          title={props.title || props.uiSchema["ui:title"]}
          required={props.required}
          formContext={props.formContext}
        />
      )}
      {props.description && (
        <DescriptionField
          id={`${props.idSchema.$id}__description`}
          description={props.description}
          formContext={props.formContext}
        />
      )}
      {props.properties.map(prop => prop.content)}
    </div>
  );
  return inline &&
    content ||
    (<fieldset>{content}</fieldset>)
    ;
}

/**
 * DescriptionField: Allow displaying markdown
 * @see https://github.com/mozilla-services/react-jsonschema-form/tree/master/src/components/fields/DescriptionField.js
 */
function DescriptionField(props) {
  const { id, description } = props;

  return (
    !description ? '' :
      <Markdown id={id} className="field-description color-gray" source={description} />
  );
}
DescriptionField.propTypes = {
  id: PropTypes.string,
  description: PropTypes.string,
};


// ###########################################################################
// Some commonly used fields + widgets
// ###########################################################################

const fields = {
  DescriptionField
};

const widgets = {
  momentTime({ value }) {
    return (!value && <span /> || <span>
      <Moment fromNow>{value}</Moment> (
      <Moment format="MMMM Do YYYY, hh:mm:ss">{value}</Moment>
      )
    </span>);
  },
  user({ value }) {
    return (value &&
      <UserBadge uid={value} /> ||
      <span className="color-lightgray">無</span>);
  },
  //mission: MissionSelect
};

const defaultFormProps = {
  uiSchema: {
    createdAt: {
      'ui:readonly': true,
      'ui:widget': 'momentTime',
      'ui:options': {
        inline: true
      }
    },
    updatedAt: {
      'ui:readonly': true,
      'ui:widget': 'momentTime',
      'ui:options': {
        inline: true
      }
    }
  },

  widgets,
  fields,
  liveValidate: true,
  showErrorList: false,
  FieldTemplate,
  ObjectFieldTemplate: DefaultObjectFieldTemplate
  // onChange: itemLog('changed'),
  // onError: itemLog('errors'),
};


// ###########################################################################
// Default children
// ###########################################################################


function ItemDeleteButton({ open }) {
  return (<Button bsStyle="danger" onClick={open}>
    <FAIcon name="trash" /> Delete
  </Button>);
}
ItemDeleteButton.propTypes = {
  open: PropTypes.func.isRequired
};

export const DefaultFormChildren = dataBind({
  /**
   * DI-decorated action: delete item
   */
  __doDelete(allArgs, fns, { }) {
    const [
      dbName,
      idArgs
    ] = getOptionalArguments(allArgs, 'dbName', 'idArgs');

    if (!dbName) {
      console.error('Cannot delete in DynamicForm, because `dbName` is not given');
      return Promise.resolve();
    }

    const doDelete = fns[`delete_${dbName}`];
    return doDelete(idArgs);
  }
})(function DefaultFormChildren(
  allArgs,
  {
    __doDelete
  }
) {
  const [
    idArgs,
    deleteMessage
  ] = getOptionalArguments(allArgs, 'idArgs', 'deleteMessage');

  const alreadyExists = !!idArgs;

  return (
    <Flexbox justifyContent="space-between" alignItems="center">
      <Flexbox>
        <button type="submit" className="btn btn-info">
          {alreadyExists ? 'Update' : 'Add new'}
        </button>
      </Flexbox>
      <Flexbox>
        {alreadyExists &&
          <ConfirmModal
            header="Confirm DELETE"
            ButtonCreator={ItemDeleteButton}
            onConfirm={__doDelete}>

            {/* { <span>{data.title}</span>} */}
          </ConfirmModal>
        }
      </Flexbox>
    </Flexbox>);
});

function DefaultFormComponent({ className, ...allProps }) {
  return (<Form className={'spaced-row ' + (className || '')} {...allProps}>
    {/* the Form children are the control elements, rendered at the bottom of the form */}
    {allProps.children || <DefaultFormChildren {...allProps} />}
  </Form>);
}

// ###########################################################################
// Putting it all together
// ###########################################################################

function getAccessor(fns, writerName) {
  const fn = fns[writerName];
  if (!fn) {
    throw new Error('Invalid dbName, accessor does not exist in dataBind context: ' + writerName);
  }
  return fn;
}
let ii = 0;

/**
 * Adds dynamicity, some default components and more features to default jsonschema forms.
 */
@dataBind({
  /**
   * DI-decorated action: create or update item
   */
  __onSubmit({ formData }, allArgs, fns, { }) {
    //var _xx = [allArgs.dbName, allArgs.idArgs];
    const [
      dbName,
      idArgs,
      write,
      alwaysSet
    ] = getOptionalArguments(allArgs, 'dbName', 'idArgs', 'write', 'alwaysSet');

    if (!dbName) {
      return Promise.resolve();
    }

    // get rid of undefined fields, created by (weird) form editor
    formData = pickBy(formData, val => val !== undefined);

    if (write) {
      return write(idArgs, formData);
    }

    let writerName;
    if (!idArgs && !alwaysSet) {
      // new item data
      writerName = `push_${dbName}`;
      const doWrite = getAccessor(fns, writerName);
      return doWrite(formData);
    }
    else {
      // existing item data
      writerName = `set_${dbName}`;
      const doWrite = getAccessor(fns, writerName);
      return doWrite(idArgs, formData);
    }
  }
})
export default class DynamicForm extends Component {
  static propTypes = {
    component: PropTypes.element,

    schema: PropTypes.object,
    schemaTemplate: PropTypes.object,
    schemaBuilder: PropTypes.object,

    formData: PropTypes.object,

    /**
     * The name of the data in the database.
     * 
     * The form will be filled with data from the reader `get_${dbName}`.
     * 
     * If given, `onSubmit` is called after trying to save the entry to DB,
     * using:
     * `push_${dbName}` if `idArgs` are not given (does not exist yet)
     * `set_${dbName}` if `idArgs` are given (exists already)
     * 
     * If delete button is added, data will be deleted via `delete_${dbName}`.
     */
    dbName: PropTypes.string,

    /**
     * `idArgs` should be an object containing all args required for 
     * producing the path of object at `dbName`.
     * If not provided, the form will stay empty.
     * If not provided, submitting will push to db as new entry (instead of setting it).
     */
    idArgs: PropTypes.object,

    /**
     * If true, only use the set writer, never try to push, even if idArgs are not given.
     */
    alwaysSet: PropTypes.bool,

    /**
     * Custom writer to write to on submit. If set, will never call push or set writer.
     */
    write: PropTypes.func,

    /**
     * callback has three arguments:
     * 1. `idArgs`
     * 2. default jsonschema-form argument
     * 3. promise from saving the result to DB
     */
    onSubmit: PropTypes.func,

    /**
     * callback has two arguments:
     * 1. `idArgs`
     * 2. default jsonschema-form argument
     */
    onChange: PropTypes.func
  };

  constructor(...args) {
    super(...args);

    this.state = {
      originalFormData: null,
      formData: NOT_LOADED
    };

    this.dataBindMethods(
      '_onUpdate',
      'onSubmit',
      'onChange'
    );
  }

  componentWillMount() {
    this._onUpdate(this.props);
  }

  /**
   * This works even when we use DB data since DB data is sent via context updates.
   * see: https://github.com/facebook/react/pull/5787
   */
  componentWillReceiveProps(nextProps) {
    this._onUpdate(nextProps);
  }

  _onUpdate(nextProps,
    { },
    fns,
    { }
  ) {
    const {
      dbName,
      idArgs,
      formData
    } = nextProps;

    let stateUpdate;
    if (dbName) {
      if (!this.state.originalFormData) {
        // formData is queried from DB
        if (formData) {
          console.error('DynamicForm should not set `formData` when `dbName` is set - ignored.');
        }

        const readerName = `get_${dbName}`;
        const doGet = getAccessor(fns, readerName);
        const newFormData = doGet(idArgs);

        // only fetch data from DB initially
        //if (newFormData !== stateUpdate.formData) {}
        if (!!newFormData) {
          stateUpdate = {
            formData: newFormData,
            originalFormData: newFormData
          };
        }
      }
    }
    else {
      // formData must be passed explicitely
      if (!this.state.formData ||
        !formData ||
        formData !== this.state.originalFormData) {
        // formData changed
        stateUpdate = {
          formData: formData,
          originalFormData: formData
        };
      }
      else {
        // nothing to do!
      }
    }
    if (stateUpdate) {
      console.warn(stateUpdate);
      this.setState(stateUpdate);
    }
  }

  onSubmit = (formArgs, { }, { __onSubmit }) => {
    const promise = __onSubmit(formArgs);

    const { idArgs } = this.props;
    this.props.onSubmit && this.props.onSubmit(idArgs, formArgs, promise);
  }

  onChange = (formArgs) => {
    //const { idArgs } = this.props;
    const { formData } = formArgs;

    this.props.onChange && this.props.onChange(formArgs);

    console.warn(formData);
    this.setState({
      formData
    });
  }

  render(...allArgs) {
    const {
      formData
    } = this.state;
    if (formData === NOT_LOADED) {
      console.error('formData === NOT_LOADED');
      return <LoadIndicator />;
    }

    //setTimeout(() => this.forceUpdate(), 300);

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

      ...otherProps
    } = getProps();

    let formProps = merge({}, defaultFormProps, otherProps);

    if (this.schema) {
      schema = this.schema;
    }
    else {
      if (!!schema + !!schemaBuilder + !!schemaTemplate !== 1) {
        throw new Error('one and only one of the three properties [schema, schemaBuilder, schemaTemplate] must be defined!');
      }

      if (schemaTemplate) {
        // template overrides builder
        schemaBuilder = new DynamicFormSchemaBuilder(schemaTemplate);
      }

      if (schemaBuilder) {
        // builder overrides schema
        schema = schemaBuilder.build(formProps.uiSchema, [formData, ...allArgs]);
      }
      this.schema = schema;
    }

    formProps = merge(formProps, {
      schema,
      formData,
      onSubmit: this.onSubmit,
      onChange: this.onChange
    });

    const Component = component || DefaultFormComponent;
    return (<Component
      {...formProps}
    />);
  }
}
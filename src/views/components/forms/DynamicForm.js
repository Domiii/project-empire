import DynamicFormSchemaBuilder, {
  isFormDataEqual
} from 'src/core/forms/DynamicFormSchema';

import merge from 'lodash/merge';
import mapValues from 'lodash/mapValues';
import map from 'lodash/map';
import pickBy from 'lodash/pickBy';
import isEmpty from 'lodash/isEmpty';
import every from 'lodash/every';
import isEqual from 'lodash/isEqual';
import isEqualWith from 'lodash/isEqualWith';

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
import ImageLoader from 'src/views/components/util/react-imageloader';
import LoadIndicator from 'src/views/components/util/loading';
import ConfirmModal from 'src/views/components/util/ConfirmModal';
import Markdown from 'src/views/components/markdown';

import UserBadge from 'src/views/components/users/UserBadge';
import { EmptyObject } from '../../../util';


/**
 * Determine whether "small" is a subset of "big"
 * @see https://stackoverflow.com/questions/35737312/find-if-an-object-is-subset-of-another-object-in-javascript/48971177#48971177
 */
function isSubset(big, small) {
  return every(small,
    (v, k) => isEqual(v, big[k])
  );
}

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
  userIcon(props) {
    const {
      size, className,
      value,
      readonly,
      disabled,
      autofocus,
      onBlur,
      onFocus,

      // some props who should not participate
      options,
      schema,
      formContext,
      registry,
      rawErrors,
      ...inputProps
    } = props;

    inputProps.type = options.inputType || inputProps.type || 'text';
    const _onChange = ({ target: { value } }) => {
      //return props.onChange(value === '' ? options.emptyValue : value);
      return props.onChange(value);
    };

    const iconClassName = 'max-size-3 user-icon ' + (className || '');

    return (<span>
      <ImageLoader
        src={value}
        preloader={LoadIndicator}
        className={iconClassName}
        title={value}>
      </ImageLoader>
      <input
        className="form-control"
        readOnly={readonly}
        disabled={disabled}
        autoFocus={autofocus}
        value={value === null ? '' : value}
        {...inputProps}
        onChange={_onChange}
        onBlur={onBlur && (event => onBlur(inputProps.id, event.target.value))}
        onFocus={onFocus && (event => onFocus(inputProps.id, event.target.value))}
      />
    </span>);
  }
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
      idArgs,
      deleter
    ] = getOptionalArguments(allArgs, 'dbName', 'idArgs', 'deleter');

    if (!dbName && !deleter) {
      console.error('Cannot delete in DynamicForm, because neither `dbName` nor `deleter` is given');
      return Promise.resolve();
    }

    const doDelete = deleter || getAccessor(fns, [`delete_${dbName}`]);
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
  const {
    uiSchema
  } = allProps;
  const options = uiSchema['ui:options'] || EmptyObject;
  const {
    inline
  } = options;

  const clazz = inline ? 'spaced-row ' : '';
  return (<Form className={clazz + (className || '')} {...allProps}>
    {/* the Form children are the control elements, rendered at the bottom of the form */}
    {allProps.children || <DefaultFormChildren {...allProps} />}
  </Form>);
}

// ###########################################################################
// Putting it all together
// ###########################################################################

function getAccessor(fns, name) {
  const fn = fns[name];
  if (!fn) {
    throw new Error('Accessor does not exist in dataBind context (does `dbName` exist?): ' + name);
  }
  return fn;
}

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
      writer
    ] = getOptionalArguments(allArgs,
      'dbName', 'idArgs', 'writer');

    if (!dbName && !writer) {
      console.error('Cannot submit in DynamicForm, because neither `dbName` nor `writer` is given');
      return Promise.resolve();
    }

    // get rid of undefined fields, created by (weird) form editor
    formData = pickBy(formData, val => val !== undefined);

    if (writer) {
      // NOTE: idArgs are not provided to custom writer!
      return writer(formData);
    }

    let writerName;
    if (!idArgs) {
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
     * If there is no custom `reader`, and `idArgs` is not provided, the form will stay empty.
     * If there is no custom `writer`, and `idArgs` is not provided, submitting will push to db as new entry (instead of setting it).
     */
    idArgs: PropTypes.object,

    /**
     * Custom reader to get data initially. If set, will not use dbName for reading.
     * Passes idArgs as single argument.
     */
    reader: PropTypes.func,

    /**
     * Custom writer to write to on submit. If set, will not use dbName for writing.
     * Only passes the formData as single argument, does not pass idArgs.
     */
    writer: PropTypes.func,

    /**
     * Custom deleter. If set, will not use dbName for deleting.
     * Passes idArgs as single argument.
     */
    deleter: PropTypes.func,

    /**
     * callback has three arguments:
     * 1. `idArgs`
     * 2. default jsonschema-form argument
     * 3. promise from saving the result to DB
     */
    onSubmit: PropTypes.func,

    /**
     * callback has one argument:
     * DynamicForm's state (formData, savedFormData, isSaved)
     */
    onChange: PropTypes.func,

    /**
     * callback has one argument:
     * DynamicForm's state (formData, savedFormData, isSaved)
     */
    onStateChange: PropTypes.func
  };

  constructor(...args) {
    super(...args);

    this.state = {
      savedFormData: NOT_LOADED,
      isSaved: true,
      formData: NOT_LOADED
    };

    this.dataBindMethods(
      '_onUpdate',
      'onSubmit',
      'onChange',
      'getSchema'
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

  getSchema = (...allArgs) => {
    const [
      { },
      { getProps }
    ] = allArgs;

    // TODO: dynamic re-evaluation of conditional form elements is not handled properly...

    if (!this.schema) {
      let {
        schema,
        schemaTemplate,
        schemaBuilder,
        uiSchema
      } = getProps();

      const {
        formData
      } = this.state;

      if (!!schema + !!schemaBuilder + !!schemaTemplate !== 1) {
        throw new Error('one and only one of the three properties [schema, schemaBuilder, schemaTemplate] must be defined!');
      }

      if (schemaTemplate) {
        // template overrides builder
        schemaBuilder = new DynamicFormSchemaBuilder(schemaTemplate);
      }

      if (schemaBuilder) {
        // builder overrides schema
        uiSchema = merge({}, defaultFormProps.uiSchema, uiSchema);
        schema = schemaBuilder.build(uiSchema, [formData, ...allArgs]);
      }
      this.schema = schema;
    }
    return this.schema;
  }

  _onUpdate(nextProps,
    { },
    fns,
    { }
  ) {
    const {
      dbName,
      idArgs,
      formData,
      reader
    } = nextProps;

    let stateUpdate;
    if (dbName || reader) {
      // formData is queried from DB
      const doGet = reader || getAccessor(fns, `get_${dbName}`);
      const newFormData = doGet(idArgs);

      const schema = this.getSchema();

      if (this.state.savedFormData === NOT_LOADED || !isFormDataEqual(this.state.savedFormData, newFormData, schema)) {
        // only fetch data from DB initially
        //if (newFormData !== stateUpdate.formData) {}
        if (newFormData !== NOT_LOADED && newFormData !== this.state.savedFormData) {
          stateUpdate = {
            savedFormData: newFormData
          };

          if (this.state.formData === NOT_LOADED) {
            // only override, if not loaded before
            stateUpdate.formData = newFormData;
          }

          if (formData) {
            // merge formData into the mix (if not already mixed in)
            const latest = newFormData || this.state.formData;
            if (!latest || !isSubset(latest, formData)) {
              stateUpdate = merge(
                stateUpdate || { formData: this.state.formData },
                { formData }
              );
            }
          }
        }
      }
    }
    else {
      // formData must be passed explicitely
      if (!this.state.formData ||
        formData === null ||
        formData !== this.state.savedFormData) {
        // formData changed
        stateUpdate = {
          formData: formData,
          savedFormData: formData
        };
      }
      else {
        // nothing to do!
      }
    }

    if (stateUpdate) {
      this._fixStateUpdate(stateUpdate);
      this._stateChange(stateUpdate);
    }
  }

  onSubmit = (formArgs, { }, { __onSubmit }) => {
    const promise = __onSubmit(formArgs);

    const { idArgs } = this.props;
    this.props.onSubmit && this.props.onSubmit(idArgs, formArgs, promise);
  }

  onChange = (stateUpdate) => {
    //const { idArgs } = this.props;
    stateUpdate = Object.assign({}, stateUpdate);

    this._fixStateUpdate(stateUpdate);

    this.props.onChange && this.props.onChange(stateUpdate);

    this._stateChange(stateUpdate);
  }

  _fixStateUpdate = (stateUpdate) => {
    const newFormData = stateUpdate.formData || this.state.formData;
    const savedData = stateUpdate.savedFormData || this.state.savedFormData;
    //console.log(isEqual(newFormData, savedData), newFormData, savedData);
    stateUpdate.isSaved = isFormDataEqual(newFormData, savedData, this.getSchema());
  }

  _stateChange = (stateUpdate) => {
    //console.error('_stateChange', this.state, stateUpdate);
    console.log('_stateChange', this.state, stateUpdate);

    if (stateUpdate) {
      this.setState(stateUpdate);
      this.props.onStateChange && setTimeout(() => this.props.onStateChange(this.state));
    }
  }

  render(...allArgs) {
    const {
      formData
    } = this.state;
    if (formData === NOT_LOADED) {
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

    schema = this.getSchema();

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
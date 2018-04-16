import map from 'lodash/map';
import filter from 'lodash/filter';
import pick from 'lodash/pick';

import { EmptyObject, EmptyArray } from 'src/util';

import React, { Component } from 'react';
import autoBind from 'react-autobind';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { 
  reduxForm,
  formValueSelector,
  Field,
  FormSection
} from 'redux-form';
import {
  Button,
  ToggleButton, ToggleButtonGroup
} from 'react-bootstrap';

import { 
  FAIcon
} from 'src/views/components/util';


import { 
  validateAndSanitizeFormat,
  getOptions,
  isItemReadonly,
  isItemInput,
  filterDisabledValues
} from './FormDef';



export function renderOptions(item, options) {
  const optionType = item.type; // checkbox or radio
  return (map(options, (option, i) => {
    const fieldId = `${item.id}.${option.value}`;
    const name = (
      item.type === 'radio' ?
        item.id :
        fieldId
      );
    return (
      <label key={option.value || i} 
        htmlFor={fieldId}
        className="formInputOption">
        <Field
          id={fieldId}
          name={name}
          component="input"
          type={optionType}
          value={option.value}
        />{' '}
        {option.label}
      </label>
    );
      // return (<ToggleButton key={i}
      //     name={item.id} id={item.id}
      //     value={option.value} block>
      //   {option.label}
      // </ToggleButton>);
    }));
}

export const formTypeInputComponents = {
  section: ({ getValue, context, item }) => {
    return (<div className="formSection">
      <h2>{item.title}</h2>
      <hr />
        { item.items && 
          <FormItemsInput {...{
            format: item.items,
            context,
            getValue
          }} />
        }
    </div>);
  },
  text: ({ getValue, context, item }) => {
    return (<div>
      <Field
        id={item.id}
        name={item.id}
        component="textarea"
        style={{width: '100%'}} 
        rows="3" />
    </div>);
  },
  radio: ({ getValue, context, item }) => {
    const isReadonly = isItemReadonly(getValue, context, item);
    const options = getOptions(getValue, context, item);

    return (<div>
      { renderOptions(item, options) }
    </div>);
    // return (<ToggleButtonGroup 
    //     name={item.id} id={item.id}
    //     type="radio" onChange={onChange}>
    //     { renderOptions(item, options) }
    //   </ToggleButtonGroup>);
  },
  checkbox: ({getValue, context, item }) => {
    const isReadonly = isItemReadonly(getValue, context, item);
    const options = getOptions(getValue, context, item);

    return (<div>
      { renderOptions(item, options) }
    </div>);
  }
};

export function registerCustomTypeComponent(typeName, Comp) {
  formTypeInputComponents[typeName] = Comp;
}

function createInputs(getValue, context, items) {
  return (
    map(items, (item, i) => {
      // TODO: handle isReadonly correctly
      const value = item.id && getValue(item.id);
      //const isReadonly = isItemReadonly(getValue, context, item);
      const Comp = formTypeInputComponents[item.type];
      const key = item.id || i;
      const childProps = {
        key,
        name: item.id || i,
        id: item.id || i,
        getValue,
        context,
        item
      };

      const el = (<Comp {...childProps} />);

      if (!isItemInput(getValue, context, item)) {
        return el;
      }

      return (<div key={key}>
          <label>{ item.title || item.id }</label>
          { el }
        </div>);
    })
  );
}

export class FormItemsInput extends Component {
  static propTypes = {
    format: PropTypes.array.isRequired,
    context: PropTypes.object.isRequired,
    getValue: PropTypes.func.isRequired
  };

  render() {
    const {
      format,
      context,
      getValue
    } = this.props;

    const items = validateAndSanitizeFormat(getValue, context, format);
    const itemEls = createInputs(getValue, context, items);
    return (<div className="formItemsInput">
      { itemEls }
    </div>);
  }
}

/**
 * Let user edit form input
 */
@connect((state, {name}) => {
  const selector = formValueSelector(name);
  const getValue = prop => selector(state, prop);

  return {
    getValue
  };
})
class _FormInputView extends Component {
  static propTypes = {
    format: PropTypes.array.isRequired,
    context: PropTypes.object.isRequired,
    getValue: PropTypes.func.isRequired,
    name: PropTypes.string
  };

  constructor() {
    super();
    autoBind(this);
  }

  // save everything!
  _doHandleSubmit(newValues) {
    const {
      getValue, context, format,

      onSubmit
    } = this.props;

    // filter disabled items
    newValues = filterDisabledValues(newValues, getValue, context, format);
    onSubmit(newValues);
  }

  render() {
    const itemsProps = pick(this.props, 
      'format', 'context', 'getValue');

    const {
      pristine,
      reset, 
      submitting,
      handleSubmit 
    } = this.props;

    // TODO: get live values

    return (<form name={this.props.name} 
        onSubmit={handleSubmit(this._doHandleSubmit)}>
      <FormItemsInput {...itemsProps} />

      <div>
        <Button type="submit" disabled={pristine || submitting}>
          <span>
            <FAIcon name="upload" className="color-green" /> save
          </span>
        </Button>
        <Button disabled={pristine || submitting} onClick={reset}>
          <span>
            <FAIcon name="gear" className="color-red" /> reset
          </span>
        </Button>
      </div>
    </form>);
  }
}

_FormInputView = reduxForm({ enableReinitialize: true })(_FormInputView);



// TODO: prevent problems/data resets caused by connection loss 
const FormInputView = connect(
  (state, { form, name, format, context, allValues }) => {
    return ({
      form: name,
      name: name,
      format,
      context,

      initialValues: allValues
    });
  }
)(_FormInputView);

export default FormInputView;
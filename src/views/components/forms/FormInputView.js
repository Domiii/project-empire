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
  FormSection } from 'redux-form';
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
  isItemInput
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
  section: ({ allValues, context, item }) => {
    return (<div className="formSection">
      <h2>{item.title}</h2>
        { item.items && 
          <FormItemsInput {...{
            format: item.items,
            context,
            allValues
          }} />
        }
    </div>);
  },
  text: (props) => {
    return (<div>
      <Field 
        {...props}
        component="textarea"
        style={{width: '100%'}} 
        rows="3" />
    </div>);
  },
  radio: ({ allValues, context, item }) => {
    const isReadonly = isItemReadonly(allValues, context, item);
    const options = getOptions(allValues, context, item);

    return (<div>
      { renderOptions(item, options) }
    </div>);
    // return (<ToggleButtonGroup 
    //     name={item.id} id={item.id}
    //     type="radio" onChange={onChange}>
    //     { renderOptions(item, options) }
    //   </ToggleButtonGroup>);
  },
  checkbox: ({allValues, context, item }) => {
    const isReadonly = isItemReadonly(allValues, context, item);
    const options = getOptions(allValues, context, item);

    return (<div>
      { renderOptions(item, options) }
    </div>);
  }
};

export function registerCustomTypeComponent(typeName, Comp) {
  formTypeInputComponents[typeName] = Comp;
}

function createInputs(allValues, context, items) {
  return (
    map(items, (item, i) => {
      // TODO: handle isReadonly correctly
      const value = item.id && allValues[item.id];
      //const isReadonly = isItemReadonly(allValues, context, item);
      const Comp = formTypeInputComponents[item.type];
      const key = item.id || i;
      const childProps = {
        key,
        name: item.id || i,
        id: item.id || i,
        allValues,
        context,
        item
      };

      const el = (<Comp {...childProps}/>);

      if (!isItemInput(allValues, context, item)) {
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
    allValues: PropTypes.object
  };

  render() {
    const {
      format,
      context,
      allValues
    } = this.props;

    const items = validateAndSanitizeFormat(allValues, context, format);
    const itemEls = createInputs(allValues || EmptyObject, context, items);
    return (<div className="formItemsInput">
      { itemEls }
    </div>);
  }
}

/**
 * Let user edit form input
 */
// @connect(({form}, {name, allValues}) => {
//   //const selector = formValueSelector(name);
//   const liveValues = form[name];
//   console.log(liveValues);

//   return {
//     //liveValues: liveValues
//   };
// })
class _FormInputView extends Component {
  static propTypes = {
    format: PropTypes.array.isRequired,
    context: PropTypes.object.isRequired,
    allValues: PropTypes.object,
    name: PropTypes.string
  };

  constructor() {
    super();
    autoBind(this);
  }

  _doHandleSubmit(allValues) {
    const {
      onSubmit
    } = this.props;
    onSubmit(allValues);
  }

  render() {
    const itemsProps = pick(this.props, 
      'format', 'context', 'allValues');

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
            <FAIcon name="upload" className="color-green" />
              save
          </span>
        </Button>
        <Button disabled={pristine || submitting} onClick={reset}>
          <span>
            <FAIcon name="gear" className="color-red" />
              reset
          </span>
        </Button>
      </div>
    </form>);
  }
}

_FormInputView = reduxForm({ enableReinitialize: false })(_FormInputView);



// TODO: prevent problems/data resets caused by connection loss 
const FormInputView = connect(
  (state, { name, format, context, allValues }) => {
    return ({
      form: name,
      name: name,
      format,
      context,
      allValues,

      initialValues: allValues
    });
  }
)(_FormInputView);

export default FormInputView;
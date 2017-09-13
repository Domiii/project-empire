import map from 'lodash/map';
import filter from 'lodash/filter';
import pick from 'lodash/pick';

import { EmptyObject, EmptyArray } from 'src/util';

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { reduxForm, Field } from 'redux-form';
import {
  ToggleButton, ToggleButtonGroup
} from 'react-bootstrap';


import { 
  validateAndSanitizeFormat,
  isItemReadonly,
  getOptions
} from './FormDef';



export function renderOptions(item, options) {
  return (map(options, (option, i) => {
      return (<ToggleButton key={i}
          name={item.id} id={item.id}
          value={option.value} block>
        {option.label}
      </ToggleButton>);
    }));
}

export const formTypeInputComponents = {
  section: ({ allValues, context, item }) => {
    return (<div>
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
  text: ({ input: { value, onChange }, allValues, context, item }) => {
    return (<textarea style={{width: '100%'}} 
      rows="3" onChange={onChange}
      value={value} />);
  },
  radio: ({ input: { value, onChange }, allValues, context, item }) => {
    const options = getOptions(allValues, context, item);
    return (<ToggleButtonGroup 
        name={item.id} id={item.id}
        type="radio" onChange={onChange}>
        { renderOptions(item, options) }
      </ToggleButtonGroup>);
  },
  checkbox: ({ input: { value, onChange }, allValues, context, item }) => {
    const isReadonly = isItemReadonly(allValues, context, item);
    const options = getOptions(allValues, context, item);
    return (<ToggleButtonGroup 
        name={item.id} id={item.id}
        type="checkbox" onChange={onChange}>
        { renderOptions(item, options) }
      </ToggleButtonGroup>);
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
      const isReadonly = isItemReadonly(allValues, context, item);
      const Comp = formTypeInputComponents[item.type];
      const childProps = {
        key: item.id || i,
        name: item.id || i,
        id: item.id || i,
        allValues,
        context,
        item
      };

      if (isReadonly) {
        // no field necessary
        return <Comp {...childProps}/>;
      }

      return (<Field 
          {...childProps}
          component={Comp}
        />);
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
    return (<div>
      { itemEls }
    </div>);
  }
}

/**
 * Let user edit form input
 */
class _FormInputView extends Component {
  static propTypes = {
    format: PropTypes.array.isRequired,
    context: PropTypes.object.isRequired,
    allValues: PropTypes.object
  };


  render() {
    const itemsProps = pick(this.props, 
      'format', 'context', 'allValues');

    return (<div>
      <FormItemsInput {...itemsProps} />
    </div>);
  }
}

_FormInputView = reduxForm({ enableReinitialize: true })(_FormInputView);



// TODO: prevent problems/data resets caused by connection loss 

const FormInputView = connect(
  (state, { name, format, context, allValues }) => {
    return ({
      form: name,
      initialValues: {
        format, context, allValues
      },
    });
  }
)(_FormInputView);

export default FormInputView;
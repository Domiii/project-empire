import map from 'lodash/map';
import filter from 'lodash/filter';
import omit from 'lodash/omit';

import { Component } from 'react';
import PropTypes from 'prop-types';


import { 
  validateAndSanitizeFormat,
  isItemReadonly,
  getOptions
} from './FormDef';



export function renderOptions(options) {
  return (map(options, (option, i) => {
      return (<ToggleButton key={i}
          value={option.value} block>
        {option.label}
      </ToggleButton>);
    }));
}

// TODO: wrap in redux-form

export const formTypeInputComponents = {
  section: ({ input: { value, onChange }, allValues, context, item }) => {
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
    const options = getOptions(value, allValues, context, item);
    return (<ToggleButtonGroup type="radio" onChange={onChange}>
        { renderOptions(options) }
      </ToggleButtonGroup>);
  },
  checkbox: ({ input: { value, onChange }, allValues, context, item }) => {
    const isReadonly = isItemReadonly(value, allValues, context, item);
    const options = getOptions(value, allValues, context, item);
    return (<ToggleButtonGroup type="checkbox" onChange={onChange}>
        { renderOptions(options) }
      </ToggleButtonGroup>);
  }
};

export function registerCustomTypeComponent(typeName, Comp) {
  formTypeInputComponents[typeName] = Comp;
}

function createInputs(allValues, context, items) {
  return (
    map(items, (item, i) => {
      const isReadonly = isItemReadonly(value, allValues, context, item);
      const Comp = formTypeInputComponents[item.type];
      return (<Field key={item.id} name={item.id} id={item.id} component={
          <Comp {...{
            allValues,
            context,
            item
          }}/>
        } />);
    })
  );
}

export class FormItemsInput extends Component {
  static propTypes = {
    format: PropTypes.object.isRequired,
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
    const itemEls = createInputs(allValues, context, items);
    return (<div>
      { itemEls }
    </div>);
  }
}

/**
 * Let user edit form input
 */
export default class FormInputView extends Component {
  static propTypes = {
    format: PropTypes.object.isRequired,
    context: PropTypes.object.isRequired,
    submit: PropTypes.func.isRequired,

    allValues: PropTypes.object
  };


  render() {
    const {
      format,
      context,
      allValues,

      submit
    } = this.props;

    const itemsProps = omit(this.props, 'submit');
    return (<div>
      <FormItemsInput {...{itemsProps}} />
    </div>);
  }
}
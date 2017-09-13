import map from 'lodash/map';
import filter from 'lodash/filter';
import pick from 'lodash/pick';

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
      // TODO: handle isReadonly correctly
      // const isReadonly = isItemReadonly(value, allValues, context, item);
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
class _FormInputView extends Component {
  static propTypes = {
    format: PropTypes.object.isRequired,
    context: PropTypes.object.isRequired,
    allValues: PropTypes.object
  };


  render() {
    const itemsProps = pick(this.props, 
      'format', 'context', 'allValues');

    return (<div>
      <FormItemsInput {...{itemsProps}} />
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
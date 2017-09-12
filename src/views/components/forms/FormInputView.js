import map from 'lodash/map';
import filter from 'lodash/filter';
import omit from 'lodash/omit';


import { validateAndSanitizeFormat } from './FormDef';



export function renderOptions(value, options) {

}



export const formTypeInputComponents = {
  section: ({value, allValues, context, item}) {
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
 TODO: () => {
  return (<span>
    <Button bsStyle="success" bsSize="small">
     all <i className="fa fa-check" />
    </Button>
    <Button bsStyle="warning" bsSize="small">
     some <i className="fa fa-cube" />
    </Button>
    <Button bsStyle="danger" bsSize="small">
     none <i className="fa fa-remove" />
    </Button>
   </span>);
 },
 text: () => {
  return (<textarea style={{width: '100%'}} rows="3" />);
 },
 radio: () => {
  return (<ButtonToolbar>
    <ToggleButtonGroup type="radio" name="options" defaultValue={1}>
      <ToggleButton value={1} block>
        Radio 1 (pre-checked)
      </ToggleButton>
      <ToggleButton value={2} block>Radio 2</ToggleButton>

      <ToggleButton value={3} block>Radio 3</ToggleButton>
    </ToggleButtonGroup>
  </ButtonToolbar>));
 },
 checkbox: () => {

 }
};

export function registerCustomTypeComponent(typeName, Comp) {
  formTypeInputComponents[typeName] = Comp;
}

function createInputs(allValues, context, items) {
  return (
    map(items, item => {
      const Comp = formTypeInputComponents[item.type];
      return (<Comp {...
          key: ,
          value: ,
          allValues: ,
          context,
          item
        }/>);
    });
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
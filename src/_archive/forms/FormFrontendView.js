


export function renderItemDefault(value, data) {
 return (<span>{ data }</span>);
}


/**
 * Render data in a simple plain format
 */
class FormFrotendView extends Component {
  static propTypes = {
    format: PropTypes.object.isRequired,
    context: PropTypes.object.isRequired,
    values: PropTypes.object
  };

}
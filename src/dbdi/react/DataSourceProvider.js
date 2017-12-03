import React, { Component, Children } from 'react';
import PropTypes from 'prop-types';


import { 
  dataBindChildContextStructure,
  buildReactContextFromDataSourceTree
} from './lib/dbdi-react-internals';


/**
 * provide all configured DataSources + providers to all children
 */
export default class DataSourceProvider extends Component {
  static childContextTypes = dataBindChildContextStructure;
  static propTypes = {
    dataSourceTree: PropTypes.object.isRequired,
    children: PropTypes.object.isRequired
  };

  constructor(props, context) {
    super(props, context);
  }

  getChildContext() {
    const {
      dataSourceTree
    } = this.props;
    return buildReactContextFromDataSourceTree(dataSourceTree, this.context);
  }

  render() {
    const {
      children
    } = this.props;
    return Children.only(children);
  }
}
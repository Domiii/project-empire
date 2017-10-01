import isObject from 'lodash/isObject';
import some from 'lodash/some';

import { EmptyObject, EmptyArray } from 'src/util';

import React, { Component, Children } from 'react';
import PropTypes from 'prop-types';

import LoadIndicator from 'src/views/components/util/loading';

import { 
  dataBindContextStructure,
  dataBindChildContextStructure,
  buildReactContextFromDataSourceTree
} from './lib/dbdi-react-internals';

import DataSourceTree from '../DataSourceTree';


/**
 * TODO: must provide DataSource to all children
 */
export default class DataSourceProvider extends Component {
  static childContextTypes = dataBindChildContextStructure;
  static propTypes = {
    dataProviders: PropTypes.object.isRequired,
    dataSourceConfig: PropTypes.object.isRequired,
    children: PropTypes.object.isRequired
  };

  constructor(props, context) {
    super(props, context);

    const {
      dataProviders,
      dataSourceConfig
    } = props;

    const dataSourceTree = new DataSourceTree(dataProviders, dataSourceConfig);
    this._dataSourceTree = dataSourceTree;
  }

  getChildContext() {
    return buildReactContextFromDataSourceTree(this._dataSourceTree);
  }

  render() {
    const {
      children
    } = this.props;
    return Children.only(children);
  }
}
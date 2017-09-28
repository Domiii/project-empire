import isObject from 'lodash/isObject';
import some from 'lodash/some';

import { EmptyObject, EmptyArray } from 'src/util';

import React, { Component, Children } from 'react';
import PropTypes from 'prop-types';

import LoadIndicator from 'src/views/components/util/loading';

import { 
  dataBindContextStructure,
  dataBindChildContextStructure,
  getDataSourceFromReactContext
} from './lib/dbdi-react-internals';


/**
 * TODO: must provide DataSource to all children
 */
export class DataSourceProvider extends Component {
  static contextTypes = getDataSourceFromReactContext;
  static childContextTypes = dataBindChildContextStructure;

  constructor(props, context) {
    super(props, context);

    const {
      dataProviders,
      dataSourceConfig
    } = props;

    const dataSourceTree = new DataSourceTree(dataProviders, dataSourceConfig);
    this._dataSource = dataSourceTree._root;
  }

  getChildContext() {
    return buildReactContextFromDataSource(this._dataSource);
  }

  render() {
    const {
      children
    } = this.props;
    return Children.only(children);
  }
}
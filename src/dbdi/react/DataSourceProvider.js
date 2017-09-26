import isObject from 'lodash/isObject';
import some from 'lodash/some';

import { EmptyObject, EmptyArray } from 'src/util';

import React, { Component, Children } from 'react';
import PropTypes from 'prop-types';

import LoadIndicator from 'src/views/components/util/loading';

import { 
  dataBindContextStructure,
  getDataSourceFromReactContext
} from './lib/dbdi-react-internals';


/**
 * TODO: must provide DataSource to all children
 */
export class DataSourceProvider extends Component {
  constructor(props, context) {
    super(props, context);

    const {
      dataProviders,
      dataSourceConfig
    } = props;

    // TODO: Build DataContext and provide it!
  }

  getChildContext() {
    // TODO
  }

  render() {
    const {
      children
    } = this.props;
    return Children.only(children);
  }
}
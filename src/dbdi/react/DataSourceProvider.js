import React, { Component, Children } from 'react';
import PropTypes from 'prop-types';


import {
  dataBindChildContextStructure,
  buildReactContextFromDataSourceTree
} from './lib/dbdi-react-internals';




//let _lastWrapperId = 0;
let _errorState = null;

class ErrorBoundary extends React.Component {
  static propTypes = {
    //wrapperId: PropTypes.number.isRequired,
    children: PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  componentDidCatch(err, info) {
    // Display fallback UI
    this.setState({ hasError: true });

    // You can also log the error to an error reporting service
    //const { wrapperId } = this.props;
    if (!_errorState) {
      console.error('[Component render ERROR]', info, '\n ', err.stack);
      _errorState = (<pre style={{ color: 'red' }}>[Component render ERROR] {err.stack}</pre>);
    }
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      //const { wrapperId } = this.props;
      return _errorState;
    }
    return Children.only(this.props.children);
  }
}

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
    return (<ErrorBoundary>
      {Children.only(children)}
    </ErrorBoundary>);
  }
}
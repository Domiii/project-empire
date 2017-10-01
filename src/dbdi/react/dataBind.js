import DataAccessTracker from '../DataAccessTracker';

import isPlainObject from 'lodash/isPlainObject';
import isFunction from 'lodash/isFunction';
import isArray from 'lodash/isArray';
import isObject from 'lodash/isObject';
import forEach from 'lodash/forEach';
import some from 'lodash/some';

import { EmptyObject, EmptyArray } from 'src/util';

import autoBind from 'src/util/auto-bind';

import React, { Component, Children } from 'react';
import PropTypes from 'prop-types';

import {
  dataBindContextStructure,
  dataBindChildContextStructure,
  getDataSourceTreeFromReactContext,
  buildReactContextFromDataSourceTree
} from './lib/dbdi-react-internals';
import { injectRenderArgs } from './react-util';

// class ReactContextDataProvider extends DataProviderBase {
//   // TODO: a data provider to read/write the local React context without it's usual shortcomings
//   // TODO: proper pub-sub bindings
// }


export default () => _WrappedComponent => {
  class WrapperComponent extends Component {
    static contextTypes = dataBindContextStructure;
    static childContextTypes = dataBindChildContextStructure;

    _dataSourceTree;
    _dataAccessTracker;

    /**
     * The dataProxy first checks for props, then for context, and if nothing is provided,
     * it executes any pre-configured dataRead node of given name and returns their value.
     * When data is attempted to be read, its path is added as a dependency, 
     * and loading initialized if it has not initialized before.
     */
    _dataProxy;

    /**
     * Provides read and write executer functions, as well as special functions as defined in
     * below _buildSpecialExecutorFunctions.
     */
    _dataExecuterProxy;

    _specialFunctions;
    _moreContext = {};

    _shouldUpdate;

    constructor(props, context) {
      super(props, context);

      this._shouldUpdate = false;
      this._dataSourceTree = getDataSourceTreeFromReactContext(context);
      this._dataAccessTracker = new DataAccessTracker(this._dataSourceTree, this._onNewData);

      autoBind(this);

      // prepare all the stuff
      this._buildSpecialExecutorFunctions();
      this._buildDataInjectionProxy();
      this._buildDataExecutorProxy();

      // finally, engulf the new component with our custom arguments
      this.WrappedComponent = injectRenderArgs(_WrappedComponent,
        this._provideRenderArguments);
    }

    _buildSpecialExecutorFunctions() {
      this._specialFunctions = {
        /**
         * Add context contents.
         * 
         * TODO: This is really bad. 
         *    Need to provide a pub-sub solution using a custom DataProvider instead.
         */
        setContext: (newContext) => {
          Object.assign(this._moreContext, newContext);
        }
      };
    }

    /**
     * Build the proxy to deliver direct data injection.
     */
    _buildDataInjectionProxy() {
      this._dataProxy = new Proxy({}, {
        get: (target, name) => {
          // 1) check props
          if (this.props[name]) {
            return this.props[name];
          }

          // 2) check context
          if (this.context[name]) {
            return this.context[name];
          }

          // 3) check readers
          const readData = this._dataAccessTracker.resolveReadData(name);
          if (readData) {
            return readData();
          }

          console.error(`Invalid request for data: Component requested "${name}" but it does not exist.`);
          return undefined;
        }
      });
    }

    /**
     * Build the proxy to deliver executor functions
     */
    _buildDataExecutorProxy() {
      this._dataExecuterProxy = new Proxy({}, {
        get: (target, name) => {
          // 1) check readers
          const readData = this._dataAccessTracker.resolveReadData(name);
          if (readData) {
            return readData;
          }

          // 2) check writers
          const writeData = this._dataAccessTracker.resolveWriteData(name);
          if (writeData) {
            return writeData;
          }

          // 3) check special function
          const specialFn = this._specialFunctions[name];
          if (specialFn) {
            return specialFn;
          }

          console.error(`Invalid request for executor: Component requested "${name}" but it does not exist.`);
          return null;
        }
      });
    }

    _provideRenderArguments() {
      return [this._dataProxy, this._dataExecuterProxy];
    }

    getChildContext() {
      //console.log('dataBind.getChildContext');
      return buildReactContextFromDataSourceTree(this._dataSourceTree, this._moreContext);
    }

    componentWillUpdate() {
    }

    shouldComponentUpdate() {
      // TODO: add some DataProvider solution for context management
      // TODO: has any subscribed data in any child component changed?

      //return this.shouldUpdate;
      return true;
    }

    componentDidMount() {
      console.log('dataBind.componentDidMount');

      this._shouldUpdate = true;
      this.forceUpdate();
    }

    componentWillUnmount() {
      this._dataAccessTracker.unmount();

      this._moreContext = {};   // reset context
      this._shouldUpdate = true;
    }

    _onNewData(path, val) {
      this._shouldUpdate = true;
      //this.forceUpdate();
      this.setState(EmptyObject);
    }

    render() {
      this._shouldUpdate = false;
      const { WrappedComponent } = this;
      return (<WrappedComponent {...this.props} data={this.data} />);
    }
  }

  return WrapperComponent;
};
import DataAccessTracker from '../DataAccessTracker';

import partialRight from 'lodash/partialRight';
import map from 'lodash/map';
import mapValues from 'lodash/mapValues';
import merge from 'lodash/merge';
import isFunction from 'lodash/isFunction';
import isPlainObject from 'lodash/isPlainObject';
import isEmpty from 'lodash/isEmpty';
import isString from 'lodash/isString';

import fpGroupBy from 'lodash/fp/groupBy';
import fpMap from 'lodash/fp/map';
import fpMapValues from 'lodash/fp/mapValues';
import fpToPairs from 'lodash/fp/toPairs';
import fpZipObject from 'lodash/fp/zipObject';
import flow from 'lodash/fp/flow';


import { EmptyObject, EmptyArray } from 'src/util';

import autoBind from 'src/util/auto-bind';

import React, { Component, Children } from 'react';
import PropTypes from 'prop-types';

import {
  dataBindContextStructure,
  dataBindChildContextStructure,
  getDataSourceTreeFromReactContext,
  getCustomContextFromReactContext,
  buildReactContextForDataBind
} from './lib/dbdi-react-internals';
import { injectRenderArgs } from './react-util';

// class ReactContextDataProvider extends DataProviderBase {
//   // TODO: a data provider to read/write the local React context without it's usual shortcomings
//   // TODO: proper pub-sub bindings
// }

export default (propsOrPropCb) => WrappedComponent => {
  class WrapperComponent extends Component {
    static contextTypes = dataBindContextStructure;
    static childContextTypes = dataBindChildContextStructure;
    static propTypes = {
      setContext: PropTypes.object
    };

    _dataSourceTree;
    _dataAccessTracker;

    /**
     * The dataProxy first checks for props, then for context, and if nothing is provided,
     * it executes any pre-configured dataRead node of given name and returns their value.
     * When data is attempted to be read, its path is added as a dependency, 
     * and loading initialized if it has not initialized before.
     */
    _variableProxy;

    /**
     * Provides read and write executer functions, as well as special functions as defined in
     * below _buildFunctionProxy.
     */
    _functionProxy;

    // more data injection stuff
    _customContext;
    _customProps = {};
    _customFunctions = {};

    // bookkeeping ((currently) mostly unused)
    _isMounted;
    _shouldUpdate;

    constructor(props, context) {
      super(props, context);

      autoBind(this);

      this._shouldUpdate = false;
      this._isMounted = false;
      this._dataSourceTree = getDataSourceTreeFromReactContext(context);
      this._customContext = getCustomContextFromReactContext(context) || {};
      this._dataAccessTracker = new DataAccessTracker(
        this._dataSourceTree, this._onNewData, 
        WrappedComponent.name || '<unknown component>');


      // prepare all the stuff
      this._buildCustomFunctions();
      this._buildVariableProxy();
      this._buildFunctionProxy();

      // finally, engulf the new component with our custom arguments
      this._injectedArguments = [
        this._variableProxy,
        this._functionProxy,
        this._dataAccessTracker._injectProxy
      ];

      // const Wrapper = (...allArgs) => {
      //   const props = allArgs[allArgs.length-3];
      //   console.log(allArgs.length, ...allArgs);
      //   return (<WrappedComponent {...props} />);
      // };

      this.WrappedComponent = injectRenderArgs(
        WrappedComponent,
        this._injectedArguments
      );

      this.WrappedComponent.prototype &&
        Object.assign(this.WrappedComponent.prototype,
          this._buildPrototypeExtensions());
    }


    // ################################################
    // Private methods + properties
    // ################################################

    /**
     * These methods are added to the prototype of the wrapped component
     */
    _buildPrototypeExtensions() {
      const {
        _injectedArguments
      } = this;
      return {
        dataBindMethod(methodOrName) {
          if (!methodOrName) {
            throw new Error('invalid argument in dataBindMethod: null or undefined');
          }
          const methodName = isString(methodOrName) ?
            methodOrName :
            methodOrName.name;

          if (!methodName || !isFunction(this[methodName])) {
            debugger;
            throw new Error('Could not add data bindings to method: ' +
              methodOrName + ' - ' + this[methodName]);
          }

          //const origMethod = this[methodName];

          return this[methodName] = partialRight(
            this[methodName], 
            ..._injectedArguments
          );
          // (...ownArgs) => {
          //   return origMethod(...ownArgs, ..._injectedArguments);
          // };
        },

        dataBindMethods(...methodOrNames) {
          return map(methodOrNames, (methodOrName, i) => {
            if (!methodOrName) {
              throw new Error(
                `invalid argument #${i} in dataBindMethod(s): null or undefined`);
            }
            return this.dataBindMethod(methodOrName);
          });
        }
      };
    }

    _buildCustomFunctions() {
      this._customFunctions = {
        /**
         * Add context contents.
         * 
         * TODO: This is really bad. 
         *    Need to provide a pub-sub solution using a custom DataProvider instead.
         */
        setContext: (newContext) => {
          merge(this._customContext, newContext);
        }
      };
    }

    /**
     * Build the proxy to deliver props, context and custom data.
     */
    _buildVariableProxy() {
      this._variableProxy = new Proxy({}, {
        get: (target, name) => {
          // 1) check custom data
          if (this._customProps[name] !== undefined) {
            return this._customProps[name];
          }

          // 2) check props
          if (this.props[name] !== undefined) {
            return this.props[name];
          }

          // 3) check context
          if (this.context[name] !== undefined) {
            return this.context[name];
          }

          // 4) check custom context
          if (this._customContext[name] !== undefined) {
            //console.warn('get from customContext: ' + name);
            return this._customContext[name];
          }

          // TODO: move this somewhere else or get rid of it entirely
          // // 4) check for direct data inject
          // const readData = this._dataAccessTracker.resolveReadData(name);
          // if (readData) {
          //   return readData();
          // }

          if (this._isMounted) {
            console.error(`DI failed - Component requested props/context "${name}" but it does not exist`);
          }
          return undefined;
        }
      });
    }

    /**
     * Build the proxy to inject actions + selections
     */
    _buildFunctionProxy() {
      this._functionProxy = new Proxy({}, {
        get: (target, name) => {

          // 1) check custom actions
          const customFunction = this._customFunctions[name];
          if (customFunction) {
            return customFunction;
          }

          // 2) check readers
          const readData = this._dataAccessTracker.resolveReadData(name);
          if (readData) {
            return readData;
          }

          // 3) check writers
          const writeData = this._dataAccessTracker.resolveWriteData(name);
          if (writeData) {
            return writeData;
          }

          if (this._isMounted) {
            console.error(`DI failed - Component requested function "${name}" but it does not exist.`);
          }
          return null;
        }
      });
    }

    _wrapCustomData(data) {
      return data;
    }

    _wrapCustomFunctions(f) {
      // inject proxies as initial arguments
      return partialRight(f, ...this._injectedArguments);
    }

    _wrapCustomFunctionsAndData = flow(
      fpToPairs,
      fpGroupBy(item => isFunction(item[1]) ? 'functions' : 'data'),
      fpMapValues(items =>
        fpZipObject(fpMap(item => item[0])(items))(fpMap(item => item[1])(items))
      ),
      (items) => ({
        data: mapValues(items.data, this._wrapCustomData),
        functions: mapValues(items.functions, this._wrapCustomFunctions)
      })
    )

    _prepareInjectedProps() {
      if (propsOrPropCb) {
        // prepare _customProps object
        let props = propsOrPropCb;
        if (isFunction(propsOrPropCb)) {
          props = propsOrPropCb(...this._injectedArguments);
        }
        else if (!isEmpty(this._customProps)) {
          // already done, don't do it again!
          return;
        }

        // TODO: if a function is supplied, be smart about it

        if (props && !isPlainObject(props)) {
          throw new Error('Invalid props returned from dataBind callback: ' +
            this.wrappedComponentName);
        }

        // group props into actions and "data" props
        const {
          functions,
          data
        } = this._wrapCustomFunctionsAndData(props);

        // assign
        this._customProps = data || EmptyObject;
        Object.assign(this._customFunctions, functions);
      }
    }


    // ################################################
    // Public methods + properties
    // ################################################

    get wrappedComponentName() {
      return WrappedComponent.name || 
        '<unnamed component>';
    }

    getChildContext() {
      return buildReactContextForDataBind(this.context, this._customContext);
    }

    componentWillUpdate() {
      this._prepareInjectedProps();
    }

    shouldComponentUpdate() {
      // TODO: add some DataProvider solution for context management
      // TODO: has any subscribed data in any child component changed?

      //return this.shouldUpdate;
      return true;
    }

    componentWillMount() {
      console.log('dataBind.componentDidMount');

      const newContext = this.props.setContext;
      if (newContext) {
        this._customFunctions.setContext(newContext);
      }

      this._shouldUpdate = true;
      this._isMounted = true;
      this._prepareInjectedProps();
      this.forceUpdate();
    }

    componentDidMount() {
      console.log('dataBind.componentDidMount');
    }

    componentWillUnmount() {
      this._dataAccessTracker.unmount();

      this._customChildContext = {}; // reset context
      this._shouldUpdate = true;
      this._isMounted = false;
    }

    _onNewData(path, val) {
      this._shouldUpdate = true;
      //this.forceUpdate();
      this.setState(EmptyObject);
      //console.warn(this.wrappedComponentName, '_onNewData');
    }

    render() {
      //console.warn(this.wrappedComponentName, 'render');
      this._shouldUpdate = false;
      const { WrappedComponent } = this;

      return (<WrappedComponent
        {...this.props}
        {...this._customProps}
        {...this._customFunctions}
        readers={this._dataAccessTracker._readerProxy}
        writers={this._dataAccessTracker._writerProxy}
        dataInject={this._dataAccessTracker._injectProxy}
      />);
    }
  }

  return WrapperComponent;
};
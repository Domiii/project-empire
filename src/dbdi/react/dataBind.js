import DataAccessTracker from '../DataAccessTracker';

import merge from 'lodash/merge';
import isFunction from 'lodash/isFunction';
import isPlainObject from 'lodash/isPlainObject';
import groupBy from 'lodash/groupBy';

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


export default (propsOrPropCb) => _WrappedComponent => {
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
    _dataInjectProxy;

    /**
     * Provides read and write executer functions, as well as special functions as defined in
     * below _buildActionProxy.
     */
    _actionProxy;

    // more data injection stuff
    _customContext;
    _customProps;
    _customActions = {};

    // bookkeeping (currently mostly unused)
    _isMounted;
    _shouldUpdate;

    constructor(props, context) {
      super(props, context);

      autoBind(this);

      this._shouldUpdate = false;
      this._isMounted = false;
      this._dataSourceTree = getDataSourceTreeFromReactContext(context);
      this._customContext = getCustomContextFromReactContext(context) || {};
      this._dataAccessTracker = new DataAccessTracker(this._dataSourceTree, this._onNewData);


      // prepare all the stuff
      this._buildCustomActions();
      this._buildDataInjectionProxy();
      this._buildActionProxy();

      // finally, engulf the new component with our custom arguments
      this._renderArguments = [this._dataInjectProxy, this._actionProxy];

      this.WrappedComponent = injectRenderArgs(_WrappedComponent,
        this._renderArguments);
    }

    // ################################################
    // Private methods + properties
    // ################################################

    _buildCustomActions() {
      this._customActions = {
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
     * Build the proxy to deliver direct data injection.
     */
    _buildDataInjectionProxy() {
      this._dataInjectProxy = new Proxy({}, {
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
            console.error(`Invalid request for data: Component requested "${name}" but it does not exist.`);
          }
          return undefined;
        }
      });
    }

    /**
     * Build the proxy to inject actions + selections
     */
    _buildActionProxy() {
      this._actionProxy = new Proxy({}, {
        get: (target, name) => {
          // 1) check custom actions
          const customAction = this._customActions[name];
          if (customAction) {
            return customAction;
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
            console.error(`Invalid request for function: Component requested "${name}" but it does not exist.`);
          }
          return null;
        }
      });
    }
    
    _separateActionsAndData = flow(
      fpToPairs,
      fpGroupBy(item => isFunction(item[1]) ? 'actions' : 'data' ),
      fpMapValues(items => 
        fpZipObject(fpMap(item => item[0])(items))(fpMap(item => item[1])(items))
      )
    )

    _prepareInjectedProps() {
      if (propsOrPropCb) {
        // prepare _moreProps object
        let props = propsOrPropCb;
        if (isFunction(propsOrPropCb)) {
          props = propsOrPropCb(...this._renderArguments);
        }
        else if (!!this._customProps) {
          // already done, don't do it again!
          return;
        }

        if (props && !isPlainObject(props)) {
          throw new Error('Invalid props returned from dataBind callback: ' +
            this.wrappedComponentName);
        }

        // group props into actions and "data" props
        const {
          actions,
          data
        } = this._separateActionsAndData(props);

        // assign
        this._customProps = data || EmptyObject;
        Object.assign(this._customActions, actions);
      }
    }


    // ################################################
    // Public methods + properties
    // ################################################

    get wrappedComponentName() {
      return _WrappedComponent.name || '<unnamed component>';
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
        this._customActions.setContext(newContext);
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

      this._customChildContext = {};   // reset context
      this._shouldUpdate = true;
      this._isMounted = false;
    }

    _onNewData(path, val) {
      this._shouldUpdate = true;
      //this.forceUpdate();
      this.setState(EmptyObject);
      //console.log('_onNewData', path);
    }

    render() {
      this._shouldUpdate = false;
      const { WrappedComponent } = this;
      return (<WrappedComponent {...this.props} {...this._moreProps} />);
    }
  }

  return WrapperComponent;
};
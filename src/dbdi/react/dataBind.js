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

import { injectRenderArgs } from './react-util';

import LoadIndicator from 'src/views/components/util/loading';

// class ReactContextDataProvider extends DataProviderBase {
//   // TODO: a data provider to read/write the local React context without it's usual shortcomings
//   // TODO: proper pub-sub bindings
// }



const dataBindScopeNamespace = '_dataBind_context';
const dataAccessNamespace = '_dataAccess';
const dataBindContextStructure = {
  [dataBindScopeNamespace]: PropTypes.object
};
const dataBindChildContextStructure = {
  [dataBindScopeNamespace]: PropTypes.object//.isRequired
};

function _getDataBindContextScope(context) {
  return context[dataBindScopeNamespace];
}


// TODO: Include dataSourceName in accessWrapper query
// TODO: Only require explicit dataSourceName when there is a naming ambiguity?!

// Future TODO: some dataSources should be hierarchical (e.g. Cache in front of DB)
//      Should dataSource hierarchy be configurable or hardcoded?
function _getDataAccessWrappersFromContext(context) {
  const scope = _getDataBindContextScope(context);
  return scope && scope[dataAccessNamespace];
}

function _buildDataAccessContext(accessWrappers) {
  return {
    [dataBindScopeNamespace]: {
      [dataAccessNamespace]: accessWrappers
    }
  };
}


export default (dataAccessCfgOrFunc) => _WrappedComponent => {
  class WrapperComponent extends Component {
    static contextTypes = dataBindContextStructure;
    static childContextTypes = dataBindChildContextStructure;

    shouldUpdate;
    dataAccessWrappers;
    pathDescriptorSet;

    constructor(props, context) {
      super(props, context);

      this.shouldUpdate = false;
      autoBind(this);

      // TODO: support multiple dataAccess objects?
      const accessCfg = isFunction(dataAccessCfgOrFunc) ||
        dataAccessCfgOrFunc(props, context) ||
        dataAccessCfgOrFunc;

      
        
      this.WrappedComponent = injectRenderArgs(_WrappedComponent,
        () => [this.dataProxy, this.props, this.context]);
    }

    getChildContext() {
      //console.log('getChildContext');
      return _buildDataAccessContext(this.dataAccessWrappers);
    }

    componentWillUpdate() {
    }

    shouldComponentUpdate() {
      // TODO: should it update?
      // (whenever any props, context, subscribed data in this or any child have changed)
      //return this.shouldUpdate;
      return true;
    }

    componentDidMount() {
      console.log('componentDidMount');

      this.shouldUpdate = true;
      this.forceUpdate();
    }

    componentWillUnmount() {
      this.shouldUpdate = true;
      forEach(this.dataAccessWrappers, wrapper => wrapper.unmount());
    }

    _onNewData(path, val) {
      this.shouldUpdate = true;
      this.forceUpdate();
      this.setState(EmptyObject);
    }

    render() {
      this.shouldUpdate = false;
      const { WrappedComponent } = this;
      return (<WrappedComponent {...this.props} data={this.data} />);
    }
  }

  return WrapperComponent;
};
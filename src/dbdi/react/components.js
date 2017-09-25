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

// TODO: must expose DataSource to all children
export class DataSourceRoot extends Component {
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

// TODO: fix these?!

export function DataBind({ name, loading, args }, context) {
  const accessWrapper = getDataSourceFromReactContext(context);

  console.log('DataBind.render: ' + name);

  if (!accessWrapper || !accessWrapper.isDataLoaded(name, args)) {
    const LoadIndicator = loading;
    accessWrapper && accessWrapper.listenToPath(name, args);
    return (<LoadIndicator />);
  }

  let val = accessWrapper.dataProxy[name];
  if (isObject(val)) {
    val = JSON.stringify(val, null, 2);
  }
  return (<span>{val}</span>);
}
DataBind.propTypes = {
  name: PropTypes.string.isRequired,
  args: PropTypes.object,
  loading: PropTypes.func
};
DataBind.contextTypes = dataBindContextStructure;



export function Loading({ name, names, component, ...args }, context) {
  names = names || (name && [name]) || EmptyArray;
  const accessWrapper = getDataSourceFromReactContext(context);
  const isLoading = some(names, name => accessWrapper.isDataLoaded(name));
  const Component = component || LoadIndicator;
  if (isLoading) {
    return (<Component {...args} />);
  }
  else {
    return (<span />); // empty element
  }
}
Loading.propTypes = {
  name: PropTypes.string,
  names: PropTypes.array,
  component: PropTypes.func
};
Loading.contextTypes = dataBindContextStructure;



export function Loaded({ name, names, component, ...args }, context) {
  names = names || (name && [name]) || EmptyArray;
  const accessWrapper = getDataSourceFromReactContext(context);
  const isLoading = some(names, name => accessWrapper.isDataLoaded(name));
  const Component = component;
  if (!isLoading) {
    return (<Component {...args} />);
  }
  else {
    return (<span />); // empty element
  }
}
Loaded.propTypes = {
  name: PropTypes.string,
  names: PropTypes.array,
  component: PropTypes.func.isRequired
};
Loaded.contextTypes = dataBindContextStructure;



export function IfDataLoaded({ name, args, loading, loaded, loadingArgs, loadedArgs }, context) {
  const dataAccess = getDataSourceFromReactContext(context);

  if (!dataAccess || !dataAccess.isDataLoaded(name, args)) {
    const Loading = loading;
    return <Loading {...loadingArgs} />;
  }
  const Loaded = loaded;
  return <Loaded {...loadedArgs} />;
}
IfDataLoaded.propTypes = {
  name: PropTypes.string.isRequired,
  args: PropTypes.object,
  loading: PropTypes.func,
  loaded: PropTypes.func,
  loadingArgs: PropTypes.object,
  loadedArgs: PropTypes.object
};
IfDataLoaded.contextTypes = dataBindContextStructure;


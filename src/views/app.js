import firebase from 'firebase';

import DBStatusModel from 'src/core/DBStatusModel';

import isEqual from 'lodash/isEqual';

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import autoBind from 'react-autobind';

import dataBind from 'src/dbdi/react/dataBind';

import Header from './components/header';
import { FAIcon } from 'src/views/components/util';

import { Overlay, LoadOverlay } from 'src/views/components/overlays';


/* global window */


@dataBind()
export class App extends Component {
  static contextTypes = {
    //router: PropTypes.object.isRequired
  };

  static propTypes = {
    children: PropTypes.object
  };

  constructor(...args) {
    super(...args);
    this.state = { wasBusy: false };

    this.dataBindMethods(
      '_onInit'
    );
  }

  // componentWillReceiveProps(nextProps) {
  //   const { router } = this.context;
  // }

  _onInit({ }, { ensureUserInitialized }) {
    ensureUserInitialized();

    // TODO: log all visits via browserhistory hook
    // browserHistory.listen( location =>  {

    // });
  }

  componentWillMount() {
    this._onInit();
  }

  componentWillUpdate() {
    this._onInit();
  }
  

  signOut = () => {
    try {
      firebase.auth().signOut();
      // TODO: also flush DataProvider's auth cache
      setTimeout(() => window.location.reload());
    }
    catch (err) {
      console.error(err.stack);
    }
  }

  render() {
    const { children } = this.props;
    //const { router } = this.context;

    //const notYetLoaded = !dBStatusRef.isLoaded;

    // if (notYetLoaded) {
    //   // still loading
    //   return (<LoadOverlay />);
    // }

    // if (!currentUserRef && router.location.pathname !== '/sign-in') {
    //   setTimeout(() => router.replace('/sign-in'), 50);
    //   return (<FAIcon name="cog" spinning={true} />);
    // }

    return (
      <div className="app full-height container no-padding">
        <Header
          signOut={this.signOut}
        />

        <main className="app-main">
          {children}
        </main>
      </div>
    );
  }
}


//=====================================
//  CONNECT
//-------------------------------------

export default App;

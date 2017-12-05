import firebase from 'firebase';

import DBStatusModel from 'src/core/DBStatusModel';

import isEqual from 'lodash/isEqual';

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import autoBind from 'react-autobind';

import dataBind from 'src/dbdi/react/dataBind';

import Header from './components/header';
import { FAIcon } from 'src/views/components/util';
import { lookupLocalized } from 'src/util/localizeUtil';

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

  static childContextTypes = {
    lookupLocalized: PropTypes.func
  };

  getChildContext() {
    return {
      lookupLocalized: this.lookupLocalized
    };
  }

  constructor(...args) {
    super(...args);
    this.state = { wasBusy: false };

    // this.dataBindMethods(
    //   this.componentWillUpdate
    // );

    autoBind(this);
  }

  // componentWillReceiveProps(nextProps) {
  //   const { router } = this.context;
  // }

  componentWillUpdate() {
    const { ensureUserInitialized } = this.props.writers;

    ensureUserInitialized();
        
    // TODO: log all visits via browserhistory hook
    // browserHistory.listen( location =>  {
      
    // });
  }

  signOut() {
    try {
      firebase.auth().signOut();
      setTimeout(() => window.location.reload());
    }
    catch (err) {
      console.error(err.stack);
    }
  }

  lookupLocalized(obj, entry) {
    const { currentUser } = this.props.fromReader;
    const lang = currentUser && currentUser.userLocale || 'en';
    return lookupLocalized(lang, obj, entry);
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
      <div className="app container full-height">
        <Header
          signOut={this.signOut}
        />

        <main className="app-main full-height">
          { children }
        </main>
      </div>
    );
  }
}


//=====================================
//  CONNECT
//-------------------------------------

export default App;

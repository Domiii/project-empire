import firebase from 'firebase';

import DBStatusModel from 'src/core/DBStatusModel';

import isEqual from 'lodash/isEqual';

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import autoBind from 'react-autobind';
import Flexbox from 'flexbox-react';

import dataBind from 'src/dbdi/react/dataBind';

import Header from './components/header';
import { FAIcon } from 'src/views/components/util';

import { Overlay, LoadOverlay } from 'src/views/components/overlays';
import styled from 'styled-components';


/* global window */

// we kinda need to hack this because the Bootstrap 3 navbar doesn't play nicely with flexbox
const HeaderWrapper = styled(Flexbox) `
margin-bottom: 5px;
`;

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

  UNSAFE_componentWillMount() {
    this._onInit();
  }

  UNSAFE_componentWillUpdate() {
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
      <Flexbox flexDirection="column" justifyContent="flex-start"
        className="app full-width full-height">
        <HeaderWrapper className="full-width">
          <div className="container no-padding">
            <Header
              signOut={this.signOut}
            />
          </div>
        </HeaderWrapper>

        <Flexbox className="full-width full-height">
          <main className="app-main full-width full-height">
            {children}
          </main>
        </Flexbox>
      </Flexbox>
    );
  }
}


//=====================================
//  CONNECT
//-------------------------------------

export default App;

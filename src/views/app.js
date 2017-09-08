import DBStatusRef from 'src/core/DBStatusRef';
import { UserInfoRef } from 'src/core/users';
import { createSelector } from 'reselect';

import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import autoBind from 'react-autobind';
import { 
  firebaseConnect, 
  helpers,
  getFirebase
} from 'react-redux-firebase'
import Header from './components/header';
import { FAIcon } from 'src/views/components/util';
import { lookupLocalized } from 'src/util/localizeUtil';

import { Overlay, LoadOverlay } from 'src/views/components/overlays';

const { pathToJS } = helpers;

@firebaseConnect((props, firebase) => {
  const paths = [
    DBStatusRef.makeQuery()
  ];
  
  const uid = getFirebase().auth().currentUser && getFirebase().auth().currentUser.uid;
  if (uid) {
    UserInfoRef.user.addQuery(paths, {uid});
  }
  //paths.push(UserInfoRef.makeQuery());
  return paths;
})
@connect(({ firebase }, ownProps) => {
  const auth = pathToJS(firebase, 'auth');
  //const dBStatusRef = DBStatusRef(firebase);

  const props = {
    //dBStatusRef,
    //clientVersion: dBStatusRef.version()
  };

  if (auth && auth.uid) {
    // TODO: Move this to componentWillMount
    //    see: https://firebase.google.com/docs/reference/node/firebase.auth.Auth#onAuthStateChanged
    props.currentUserRef = UserInfoRef.user(firebase, {auth, uid: auth.uid});
  }

  //console.log(UserInfoRef(firebase).val);

  return props;
})
export class App extends Component {
  static contextTypes = {
    router: PropTypes.object.isRequired
  };

  static propTypes = {
    firebase: PropTypes.object.isRequired,
    currentUserRef: PropTypes.object,
    //dBStatusRef: PropTypes.object.isRequired,

    children: PropTypes.object
  };

  static childContextTypes = {
    currentUserRef: PropTypes.object,
    lookupLocalized: PropTypes.func
  };

  getChildContext() {
    return {
      currentUserRef: this.props.currentUserRef,
      lookupLocalized: this.lookupLocalized
    }
  }

  constructor(...args) {
    super(...args);
    this.state = { wasBusy: false };

    autoBind(this);
  }

  // componentWillReceiveProps(nextProps) {
  //   const { router } = this.context;
  // }

  componentWillReceiveProps(nextProps) {
    const { currentUserRef } = nextProps;

    if (!!currentUserRef) {
      currentUserRef.ensureUserInitialized();
    }
        
    // TODO: log new visit
    // TODO: add hook to browserhistory
    // browserHistory.listen( location =>  {
      
    // });
  }

  signOut() {
    try {
      this.props.firebase.logout();
      setTimeout(() => window.location.reload());
    }
    catch (err) {
      console.error(err.stack);
    }
  }

  lookupLocalized(obj, entry) {
    const lang = this.props.currentUserRef && this.props.currentUserRef.locale() || 'en';
    return lookupLocalized(lang, obj, entry);
  }

  render() {
    const { currentUserRef, children } = this.props;
    const { router } = this.context;

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
      <div className="app container max-height">
        <Header
          currentUser={currentUserRef && currentUserRef.val}
          signOut={this.signOut}
        />

        <main className="app-main max-height">
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

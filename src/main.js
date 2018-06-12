// import our own main CSS
import 'src/views/styles/styles.scss';

// import third-party CSS
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/dist/css/bootstrap-theme.css';

import 'font-awesome/css/font-awesome.min.css';

import 'react-select/dist/react-select.css';

import 'react-bootstrap-table-next/dist/react-bootstrap-table2.min.css';

import 'video.js/dist/video-js.min.css';


import moment from 'moment';

// see: https://github.com/jsmreese/moment-duration-format#module
import momentDurationFormatSetup from 'moment-duration-format';
momentDurationFormatSetup(moment);

// // import extra libraries
// import 'moment/locale/en';
// import 'moment/locale/zh-tw';


// import JS
// import 'bootstrap';   // bootstrap JS
import { version } from 'package.json';

import firebase from 'firebase/app';
import 'firebase/auth';

import React from 'react';
import ReactDOM from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import getFirebaseConfig from 'src/config/firebase.cfg';
const firebaseConfig = getFirebaseConfig();


import Root from './views/root';

import { setupDebugTools } from 'src/util/debugUtil';


setupDebugTools();

// GO!
firebase.initializeApp(firebaseConfig);
const rootElement = document.getElementById('root');


console.log(`starting app using database "${firebaseConfig.projectId}"`);


if (module.hot) {
  module.hot.accept('./views/root', () => {
    ReactDOM.render(require('./views/root').default);
  });
}

// // show a message while logging in
// ReactDOM.render(
//   <LoadOverlay message="logging in..." className="color-lightred" />,
//   rootElement
// );


// // Wait until after authentication has finished before rendering the root
// firebase.auth().onAuthStateChanged(function onAuthStateChanged(authData) {
// done! Let's kick this thing into gear!

// try {
ReactDOM.render(
  <AppContainer>
    <Root />
  </AppContainer>,
  rootElement
);
    // console.log("render success");
  // }
  // catch (err) {
  //   console.error(err.stack);
  // }
//});

//reduxFirebaseConfig.onAuthStateChanged = function onAuthStateChanged(authData) {
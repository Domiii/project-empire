const firebaseConfigs = {
  production: {
    apiKey: 'AIzaSyBJd18A_15cm6IjnRk9NgLzyi1F1gAKa48',
    authDomain: 'project-empire.firebaseapp.com',
    databaseURL: 'https://project-empire.firebaseio.com',
    projectId: 'project-empire',
    storageBucket: 'project-empire.appspot.com',
    messagingSenderId: '67569274970'
  },

  test: {
    apiKey: 'AIzaSyBZNdzJyY0VXLC-rWoYr_j7XPAeK3Oltwg',
    authDomain: 'test-project-empire.firebaseapp.com',
    databaseURL: 'https://test-project-empire.firebaseio.com',
    projectId: 'test-project-empire',
    storageBucket: 'test-project-empire.appspot.com',
    messagingSenderId: '861084752540'
  }
};

export const OauthClientId = ((function() {
  if (process.env.NODE_ENV === 'production') {
    return '67569274970-kddq09im4ioimg7qggs6f53dd9rmis4p.apps.googleusercontent.com';
  }
  else {
    return '861084752540-4o6v20knbkc8bbmdmdarjffqlsb5smdv.apps.googleusercontent.com';
  }
})());


export default () => {
  if (process.env.NODE_ENV === 'production') {
    return firebaseConfigs.production;
  }
  else {
    return firebaseConfigs.test;
  }
};
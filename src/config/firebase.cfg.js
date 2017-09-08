export const firebaseConfigs = {
  production: {
    apiKey: "AIzaSyBJd18A_15cm6IjnRk9NgLzyi1F1gAKa48",
    authDomain: "project-empire.firebaseapp.com",
    databaseURL: "https://project-empire.firebaseio.com",
    projectId: "project-empire",
    storageBucket: "project-empire.appspot.com",
    messagingSenderId: "67569274970"
  },

  test: {
    apiKey: "AIzaSyBJd18A_15cm6IjnRk9NgLzyi1F1gAKa48",
    authDomain: "project-empire.firebaseapp.com",
    databaseURL: "https://project-empire.firebaseio.com",
    projectId: "project-empire",
    storageBucket: "project-empire.appspot.com",
    messagingSenderId: "67569274970"
  }
};

export const reduxFirebaseConfig = {
  //userProfile: 'users', // root that user profiles are written to
  enableLogging: false, // enable/disable Firebase Database Logging
  updateProfileOnLogin: false // enable/disable updating of profile on login
  // profileDecorator: (userData) => ({ email: userData.email }) // customize format of user profile
};
// see: https://firebase.google.com/docs/reference/admin/node/

import admin from "firebase-admin";
import size from 'lodash/size';

import readline from 'readline';
import process from 'process';
import fs from 'fs';

// ########################################
// get started, define some data
// ########################################

const enableLogging = false;

const secretPaths = {
  production: './secret/secret.production.json',
  test: './secret/secret.test.json'
};

const appSettings = {
  production: {
    credential: admin.credential.cert(require(secretPaths.production)),
    databaseURL: "https://super-awesome-buffet.firebaseio.com"
  },
  test: {
    credential: admin.credential.cert(require(secretPaths.test)),
    databaseURL: "https://test-self-assessment.firebaseio.com"
  }
};

let isInitialized = false;


// ########################################
// setup application listeners
// ########################################

function doInit(env) {
  if (enableLogging) {
    admin.database.enableLogging(true);
  }

  const secretPath = secretPaths[env];
  const envSettings = appSettings[env];

  console.log('Connecting to db: ' + envSettings.databaseURL);

  if (!fs.existsSync(secretPath)) {
      console.error('Could not find private key file: ' + secretPath);
      console.error('');
      console.error('1. Go to your firebase console -> settings -> Service Accounts -> node.js.');
      console.error('2. Make sure, the settings align with the settings in this file');
      console.error('3. Hit "Generate New Private Key" (which downloads a JSON file)');
      console.error('4. Rename the key file to "secret.json" and put it in this directory, next to this file!');
      console.error('5. Done.');
      process.exit(-1);
  }
  global.app = admin.initializeApp(envSettings);
  global.db = admin.database();


  return db.ref('.info/connected').on('value', function(connectedSnap) {
    //console.log('CONNECTION STATUS: ' + connectedSnap.val());
    if (connectedSnap.val() === true) {
      isInitialized = true;
      console.log('#####################Connected#####################');
    } else {
      if (isInitialized) {
        console.log('#####################Disonnected#####################');
      }
    }
  });
}



// ########################################
// migrations
// ########################################


function migration(name) {
  const migration = require('./migrations/' + name);
  console.log('##############################');
  console.log('migration: ' + name);

  const res = migration().
    then(() => {
      console.log();
    });
  return res;
}


// ########################################
// start + runScripts
// ########################################

function runMigrations() {
  const migrationNames = [
    '2017_08_10_users'
  ];
  return Promise.all(migrationNames.map(migration));
}


function start(env) {
  try {
    console.log('Starting admin scripts...');
    
    runMigrations().
      catch(err => {
        console.error(err.stack);
        process.exit(-1);
      }).
      then(() => {
        console.log('Finished.');
        process.exit(0);
      });
  }
  catch (err) {
    console.error(err.stack);
    process.exit(-1);
  }
}


// ########################################
// check which mode we are in, then start scripts!
// ########################################

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Which environment do you want to migrate? - (t)est or (p)roduction?', (answer) => {
  let env;
  if (answer === 't') {
    env = 'test';
  }
  else if (answer === 'p') {
    env = 'production';
  }
  else {
    throw new Error('Invalid choice: ' + answer);
  }

  console.log("Environment: " + env);

  doInit(env);
  start(env);

  rl.close();
});

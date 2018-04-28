import firebase from 'firebase';

export async function signIn(provider) {
  // TODO: support multiple apps
  try {
    return await firebase.auth().signInWithRedirect(provider);
  }
  catch (err) {
    throw new Error('Unable to login ' + (err && err.stack || err));
  }
}

// export function signInWithGithub() {
//   return authenticate(new getFirebase().auth.GithubAuthProvider());
// };


export function signInWithGoogle() {
  return signIn(new firebase.auth.GoogleAuthProvider());
}

// export function signInWithTwitter() {
//   return authenticate(new getFirebase().auth.TwitterAuthProvider());
// };

export function isAuthenticated() {
  // TODO: support multiple apps
  return !!firebase.auth().currentUser;
}

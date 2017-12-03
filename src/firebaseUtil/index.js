import firebase from 'firebase';

export function signIn(provider) {
  // TODO: support multiple apps
  return firebase.auth().signInWithRedirect(provider);
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

import { getFirebase } from 'react-redux-firebase';

// export function authenticate(provider) {
//   return getFirebase().auth().signInWithRedirect(provider);
// };

// export function signInWithGithub() {
//   return authenticate(new getFirebase().auth.GithubAuthProvider());
// };


// export function signInWithGoogle() {
//   return authenticate(new getFirebase().auth.GoogleAuthProvider());
// };


// export function signInWithTwitter() {
//   return authenticate(new getFirebase().auth.TwitterAuthProvider());
// };

export function isAuthenticated(firebaseApp) {
  return !!getFirebase().auth().currentUser;
};


export {
  makeRefWrapper,
  addChildrenToRefWrapper
} from './RefWrapper';

export {
  m2mIndex
} from './explicitIndices';
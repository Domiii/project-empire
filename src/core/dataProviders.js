import FirebaseDataProvider, {
  FirebaseAuthProvider
} from 'src/dbdi/firebase/FirebaseDataProvider';


export default {
  firebase: new FirebaseDataProvider(),
  firebaseAuth: new FirebaseAuthProvider()
  //temp: new ...(),
  //webCache: ...
};
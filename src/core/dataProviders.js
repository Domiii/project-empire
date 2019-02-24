import FirebaseDataProvider, {
  FirebaseAuthProvider
} from 'dbdi/FirebaseDataProvider';

import { MemoryDataProvider } from 'dbdi';

export default {
  firebase: new FirebaseDataProvider(),
  firebaseAuth: new FirebaseAuthProvider(),
  memory: new MemoryDataProvider()
  //temp: new ...(),
  //webCache: ...
};
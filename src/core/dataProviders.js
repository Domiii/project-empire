import FirebaseDataProvider, {
  FirebaseAuthProvider
} from 'src/dbdi/firebase/FirebaseDataProvider';

import MemoryDataProvider from 'src/dbdi/dataProviders/MemoryDataProvider';

export default {
  firebase: new FirebaseDataProvider(),
  firebaseAuth: new FirebaseAuthProvider(),
  memory: new MemoryDataProvider()
  //temp: new ...(),
  //webCache: ...
};
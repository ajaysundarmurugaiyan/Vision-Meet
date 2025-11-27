import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA8uHF4Q8aez18MXyJRKMBEz2hvNBdQlg8",
  authDomain: "movie-share-6a45e.firebaseapp.com",
  projectId: "movie-share-6a45e",
  storageBucket: "movie-share-6a45e.appspot.com",
  messagingSenderId: "602456951394",
  appId: "1:602456951394:web:e504f804f48670f668df3b",
  measurementId: "G-ESGMJTFE6L"
};

// Initialize Firebase once per browser session
const app = firebase.apps.length ? firebase.app() : firebase.initializeApp(firebaseConfig);
const db = app.firestore();
const storage = app.storage();

export { firebase, db, storage };

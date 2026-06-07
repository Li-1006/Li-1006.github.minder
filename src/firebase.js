import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCZp5rFhd-7K4N5fUA_3skofVHnyhPij6k",
  authDomain: "minder-cbe09.firebaseapp.com",
  projectId: "minder-cbe09",
  storageBucket: "minder-cbe09.firebasestorage.app",
  messagingSenderId: "106418704546",
  appId: "1:106418704546:web:74446a853d735a0d8847fb",
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

export { auth, provider, db };
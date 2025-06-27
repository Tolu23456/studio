
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDS7HdjMRYUvk861pt0dbHCPXwR6w0_Z0w",
  authDomain: "adsener-app.firebaseapp.com",
  projectId: "adsener-app",
  storageBucket: "adsener-app.appspot.com",
  messagingSenderId: "1005970824212",
  appId: "1:1005970824212:web:324ede7c759bccd48cdb01",
  measurementId: "G-25HG8VWZR0",
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let isFirebaseConfigured = false;

try {
  // Check that all required keys are present and not just empty strings
  if (
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.storageBucket &&
    firebaseConfig.messagingSenderId &&
    firebaseConfig.appId
  ) {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    isFirebaseConfigured = true;
  } else {
    // This will be logged on the server if keys are missing.
    console.warn("Firebase configuration is missing or incomplete. Firebase features will be disabled.");
  }
} catch (error) {
  // This will catch errors from initializeApp() if the keys are present but invalid.
  console.error("Firebase initialization failed:", error);
}

export { app, auth, db, storage, isFirebaseConfigured };

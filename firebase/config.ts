// Fix: Add type declaration for the Firebase global object from the CDN script.
declare global {
  interface Window {
    firebase: any;
  }
}

// IMPORTANT: Replace the placeholder values below with your own Firebase project configuration.
// You can get this from the Firebase console: Project settings > General > Your apps > Web app.
// THE APP WILL NOT WORK UNTIL YOU DO THIS.
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyALUdtiTwadFiCMma5nLL-NPx1EqpHDZ9Q",
  authDomain: "mattsshop-snagging.firebaseapp.com",
  projectId: "mattsshop-snagging",
  storageBucket: "mattsshop-snagging.firebasestorage.app",
  messagingSenderId: "933688534103",
  appId: "1:933688534103:web:855f69354b1e2a6e0aaf12",
  measurementId: "G-7HQKKLJRCQ"
};
// --- Firebase Initialization ---
let app, auth, db, storage, serverTimestamp;

// Check if the config has been filled out by checking for placeholder values
const isConfigured = firebaseConfig.apiKey !== "YOUR_API_KEY" && firebaseConfig.projectId !== "YOUR_PROJECT_ID";

if (isConfigured) {
  // Initialize Firebase
  // This uses the compat libraries to align with the CDN script imports
  app = window.firebase.initializeApp(firebaseConfig);
  auth = window.firebase.auth();
  db = window.firebase.firestore();
  storage = window.firebase.storage();
  serverTimestamp = window.firebase.firestore.FieldValue.serverTimestamp;
} else {
    console.warn("FIREBASE IS NOT CONFIGURED. Please update firebase/config.ts with your project credentials.");
}


export { app, auth, db, storage, serverTimestamp, firebaseConfig, isConfigured };
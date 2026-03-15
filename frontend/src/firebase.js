import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, FacebookAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAOMSoxtmw4ec_7sdgIWKUrs45UWmFFNmc",
  authDomain: "forever-b4667.firebaseapp.com",
  projectId: "forever-b4667",
  storageBucket: "forever-b4667.firebasestorage.app",
  messagingSenderId: "170395021735",
  appId: "1:170395021735:web:55d4553850def988950682",
  measurementId: "G-TLNJN98PS2"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const facebookProvider = new FacebookAuthProvider();
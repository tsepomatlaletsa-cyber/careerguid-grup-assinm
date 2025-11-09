import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBXFqdV6lrCDdOp-xPyO16wSOUA0CDAnnk",
  authDomain: "career-guiedence.firebaseapp.com",
  projectId: "career-guiedence",
  storageBucket: "career-guiedence.appspot.com", 
  messagingSenderId: "845838893828",
  appId: "1:845838893828:web:25b2ec8129403f59510651",
  measurementId: "G-T1DM3DXFV8",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);

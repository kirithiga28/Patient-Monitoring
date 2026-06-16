import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB1u587I1xB7XoegaU0Wv9UyR8_B7LKcxU",
  authDomain: "well-care-hospital.firebaseapp.com",
  projectId: "well-care-hospital",
  storageBucket: "well-care-hospital.firebasestorage.app",
  messagingSenderId: "451983806107",
  appId: "1:451983806107:web:34146d0b886c194c64803e",
  measurementId: "G-DS0H6M55ED"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;
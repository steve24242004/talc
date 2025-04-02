import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // Import Firestore

const firebaseConfig = {
  apiKey: "AIzaSyCbZZb3AfZxUs-zCC--wUZJl3VtwZL0jPU",
  authDomain: "talc-9447c.firebaseapp.com",
  projectId: "talc-9447c",
  storageBucket: "talc-9447c.firebasestorage.com",
  messagingSenderId: "241225826331",
  appId: "1:241225826331:web:3770b036448609d542f8be",
  measurementId: "G-1JLXKT2X0D"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app); // Initialize Auth
const db = getFirestore(app); // Initialize Firestore

export { auth, db }; // Export both auth and db
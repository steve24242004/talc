import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your Firebase config
const firebaseConfig = { 
  apiKey: "AIzaSyCbZZb3AfZxUs-zCC--wUZJl3VtwZL0jPU",
  authDomain: "talc-9447c.firebaseapp.com",
  projectId: "talc-9447c",
  storageBucket: "talc-9447c.firebasestorage.com",
  messagingSenderId: "241225826331",
  appId: "1:241225826331:web:3770b036448609d542f8be",
  measurementId: "G-1JLXKT2X0D"
 };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
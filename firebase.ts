import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  CollectionReference,
  DocumentData,
  doc,
  setDoc,
  getDoc,
  where,
} from "firebase/firestore";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  UserCredential,
  onAuthStateChanged,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAGCWkJ7g5GY_x3ZKHI-A5ppNv3lvgHulQ",
  authDomain: "chatapp-522bf.firebaseapp.com",
  projectId: "chatapp-522bf",
  storageBucket: "chatapp-522bf.firebasestorage.app",
  messagingSenderId: "303268201850",
  appId: "1:303268201850:android:61905d868eb0dfa1c702c3"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Disable Firestore temporarily due to connection issues
// const db = getFirestore(app);
const db = null as any; // Placeholder

// FIXED
// export const messagesCollection = 
//   collection(db, "messages") as CollectionReference<DocumentData>;
export const messagesCollection = null as any; // Placeholder

export {
  auth,
  db,
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  doc,
  setDoc,
  getDoc,
  where,
};

export type { UserCredential };
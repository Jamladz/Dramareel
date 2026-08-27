import { initializeApp } from 'firebase/app';
import { initializeFirestore, getFirestore, collection, getDocs, doc, getDoc, setDoc, query, where, orderBy, limit, updateDoc, arrayUnion, arrayRemove, addDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';

const firebaseConfig = {
  projectId: "gen-lang-client-0163667078",
  appId: "1:638271136518:web:b935de69f34a181b997487",
  apiKey: "AIzaSyB6jUo0n3twSTlo4UOS8EUP5LT5FgGVIP4",
  authDomain: "gen-lang-client-0163667078.firebaseapp.com",
  storageBucket: "gen-lang-client-0163667078.firebasestorage.app",
  messagingSenderId: "638271136518",
};

const app = initializeApp(firebaseConfig);
const firestoreDatabaseId = "ai-studio-cineflow-1409744e-c8c4-4b03-b6b2-6884fbb3c81a";

let db;
try {
  db = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true
  }, firestoreDatabaseId);
} catch (e) {
  db = getFirestore(app, firestoreDatabaseId);
}

const auth = getAuth(app);

export { db, auth };

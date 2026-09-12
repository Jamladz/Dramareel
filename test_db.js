import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf-8'));
const app = initializeApp({
  projectId: config.projectId,
  apiKey: config.apiKey,
  authDomain: config.authDomain,
});
// Need to handle databaseId? The standard web SDK doesn't easily support secondary DBs in old versions, but let's try.
const db = getFirestore(app, config.firestoreDatabaseId);

async function test() {
  const notifs = await getDocs(collection(db, 'notifications'));
  console.log("Notifications:");
  notifs.forEach(d => console.log(d.id, d.data()));
  
  const users = await getDocs(collection(db, 'users'));
  console.log("\nUsers:");
  users.forEach(d => console.log(d.id, d.data().writeAccessGranted, d.data().coins));
}
test().catch(console.error);

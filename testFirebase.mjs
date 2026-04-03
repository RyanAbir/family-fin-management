import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs } from "firebase/firestore";
import fs from "fs";

// Simple env parser
const envContent = fs.readFileSync(".env.local", "utf-8");
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.+)$/);
  if (match) env[match[1]] = match[match[2] ? 2 : ''].trim().replace(/^['"](.*)['"]$/, '$1');
  if (match) env[match[1]] = match[2].trim();
});

const firebaseConfig = {
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  try {
    console.log("Fetching properties...");
    const snap = await getDocs(collection(db, "properties"));
    console.log("Success! Found", snap.size, "properties");
    
    console.log("Testing write...");
    await addDoc(collection(db, "properties"), { test: true });
    console.log("Write success!");
    process.exit(0);
  } catch (error) {
    console.error("Error connecting to Firebase:", error.message);
    process.exit(1);
  }
}
run();

import { db, isFirebaseConfigured } from "../lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  Timestamp
} from "firebase/firestore";

// Check if Firebase is configured before proceeding
if (!isFirebaseConfigured()) {
  console.warn("Firebase is not configured. Please set up environment variables.");
}

// Collection reference
const transactionsRef = collection(db, "transactions");

// Add transaction
export const addTransaction = async (data) => {
  if (!isFirebaseConfigured()) {
    throw new Error("Firebase is not configured");
  }

  try {
    return await addDoc(transactionsRef, {
      ...data,
      createdAt: Timestamp.now()
    });
  } catch (error) {
    console.error("Error adding transaction:", error);
    throw error;
  }
};

// Get all transactions
export const getTransactions = async () => {
  if (!isFirebaseConfigured()) {
    console.warn("Firebase not configured, returning empty array");
    return [];
  }

  try {
    const snapshot = await getDocs(transactionsRef);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error getting transactions:", error);
    throw error;
  }
};

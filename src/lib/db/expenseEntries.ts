import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  DocumentSnapshot,
  DocumentData
} from "firebase/firestore";
import { db } from "../firebase";
import type { ExpenseEntry } from "../../types";

const expenseEntryConverter = {
  toFirestore: (entry: Omit<ExpenseEntry, 'id'>) => ({
    ...entry,
    date: Timestamp.fromDate(entry.date),
    createdAt: Timestamp.fromDate(entry.createdAt),
    updatedAt: Timestamp.fromDate(entry.updatedAt),
  }),
  fromFirestore: (snapshot: DocumentSnapshot<DocumentData>): ExpenseEntry => {
    const data = snapshot.data();
    return {
      id: snapshot.id,
      ...data,
      date: data?.date && typeof data.date.toDate === 'function' ? data.date.toDate() : (data?.date instanceof Date ? data.date : new Date()),
      createdAt: data?.createdAt && typeof data.createdAt.toDate === 'function' ? data.createdAt.toDate() : (data?.createdAt instanceof Date ? data.createdAt : new Date()),
      updatedAt: data?.updatedAt && typeof data.updatedAt.toDate === 'function' ? data.updatedAt.toDate() : (data?.updatedAt instanceof Date ? data.updatedAt : new Date()),
    } as ExpenseEntry;
  },
};

const expenseEntriesRef = collection(db, "expense_entries").withConverter(expenseEntryConverter);

// CRUD operations
export const createExpenseEntry = async (entry: Omit<ExpenseEntry, 'id'>): Promise<ExpenseEntry> => {
  const docRef = await addDoc(expenseEntriesRef, entry);
  const docSnap = await getDoc(docRef);
  return expenseEntryConverter.fromFirestore(docSnap);
};

export const getExpenseEntry = async (id: string): Promise<ExpenseEntry | null> => {
  const docRef = doc(expenseEntriesRef, id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? expenseEntryConverter.fromFirestore(docSnap) : null;
};

export const getAllExpenseEntries = async (): Promise<ExpenseEntry[]> => {
  const q = query(expenseEntriesRef);
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => expenseEntryConverter.fromFirestore(doc));
};

export const getExpenseEntriesByProperty = async (propertyId: string): Promise<ExpenseEntry[]> => {
  const q = query(expenseEntriesRef, where("propertyId", "==", propertyId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => expenseEntryConverter.fromFirestore(doc));
};

export const getExpenseEntriesByMonth = async (monthKey: string): Promise<ExpenseEntry[]> => {
  const q = query(expenseEntriesRef, where("monthKey", "==", monthKey));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => expenseEntryConverter.fromFirestore(doc));
};

export const updateExpenseEntry = async (id: string, updates: Partial<Omit<ExpenseEntry, 'id'>>): Promise<void> => {
  const docRef = doc(expenseEntriesRef, id);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: Timestamp.now(),
  });
};

export const deleteExpenseEntry = async (id: string): Promise<void> => {
  const docRef = doc(expenseEntriesRef, id);
  await deleteDoc(docRef);
};
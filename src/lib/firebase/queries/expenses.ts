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
import { db } from "@/lib/firebase";
import type { ExpenseEntry } from "@/types";

const expenseConverter = {
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
      date: data?.date?.toDate() || new Date(),
      createdAt: data?.createdAt?.toDate() || new Date(),
      updatedAt: data?.updatedAt?.toDate() || new Date(),
    } as ExpenseEntry;
  },
};

const expenseRef = collection(db, "expense_entries").withConverter(expenseConverter);

export const getExpenseEntry = async (id: string): Promise<ExpenseEntry | null> => {
  const docRef = doc(expenseRef, id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? expenseConverter.fromFirestore(docSnap) : null;
};

export const getAllExpenseEntries = async (): Promise<ExpenseEntry[]> => {
  const q = query(expenseRef, orderBy("date", "desc"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => expenseConverter.fromFirestore(doc));
};

export const getPropertyExpenses = async (propertyId: string): Promise<ExpenseEntry[]> => {
  const q = query(expenseRef, where("propertyId", "==", propertyId), orderBy("date", "desc"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => expenseConverter.fromFirestore(doc));
};

export const getMonthlyExpenses = async (propertyId: string, monthKey: string): Promise<ExpenseEntry[]> => {
  const q = query(
    expenseRef,
    where("propertyId", "==", propertyId),
    where("monthKey", "==", monthKey),
    orderBy("date", "desc")
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => expenseConverter.fromFirestore(doc));
};

export const createExpenseEntry = async (entry: Omit<ExpenseEntry, 'id'>): Promise<ExpenseEntry> => {
  const docRef = await addDoc(expenseRef, entry);
  const docSnap = await getDoc(docRef);
  return expenseConverter.fromFirestore(docSnap);
};

export const updateExpenseEntry = async (id: string, updates: Partial<Omit<ExpenseEntry, 'id'>>): Promise<void> => {
  const docRef = doc(expenseRef, id);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: Timestamp.now(),
  });
};

export const deleteExpenseEntry = async (id: string): Promise<void> => {
  const docRef = doc(expenseRef, id);
  await deleteDoc(docRef);
};

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
import type { IncomeEntry } from "../../types";

const incomeEntryConverter = {
  toFirestore: (entry: Omit<IncomeEntry, 'id'>) => ({
    ...entry,
    date: Timestamp.fromDate(entry.date),
    createdAt: Timestamp.fromDate(entry.createdAt),
    updatedAt: Timestamp.fromDate(entry.updatedAt),
  }),
  fromFirestore: (snapshot: DocumentSnapshot<DocumentData>): IncomeEntry => {
    const data = snapshot.data();
    return {
      id: snapshot.id,
      ...data,
      date: data?.date && typeof data.date.toDate === 'function' ? data.date.toDate() : (data?.date instanceof Date ? data.date : new Date()),
      createdAt: data?.createdAt && typeof data.createdAt.toDate === 'function' ? data.createdAt.toDate() : (data?.createdAt instanceof Date ? data.createdAt : new Date()),
      updatedAt: data?.updatedAt && typeof data.updatedAt.toDate === 'function' ? data.updatedAt.toDate() : (data?.updatedAt instanceof Date ? data.updatedAt : new Date()),
    } as IncomeEntry;
  },
};

const incomeEntriesRef = collection(db, "income_entries").withConverter(incomeEntryConverter);

// CRUD operations
export const createIncomeEntry = async (entry: Omit<IncomeEntry, 'id'>): Promise<IncomeEntry> => {
  const docRef = await addDoc(incomeEntriesRef, entry);
  const docSnap = await getDoc(docRef);
  return incomeEntryConverter.fromFirestore(docSnap);
};

export const getIncomeEntry = async (id: string): Promise<IncomeEntry | null> => {
  const docRef = doc(incomeEntriesRef, id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? incomeEntryConverter.fromFirestore(docSnap) : null;
};

export const getAllIncomeEntries = async (): Promise<IncomeEntry[]> => {
  const q = query(incomeEntriesRef);
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => incomeEntryConverter.fromFirestore(doc));
};

export const getIncomeEntriesByProperty = async (propertyId: string): Promise<IncomeEntry[]> => {
  const q = query(incomeEntriesRef, where("propertyId", "==", propertyId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => incomeEntryConverter.fromFirestore(doc));
};

export const getIncomeEntriesByMonth = async (monthKey: string): Promise<IncomeEntry[]> => {
  const q = query(incomeEntriesRef, where("monthKey", "==", monthKey));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => incomeEntryConverter.fromFirestore(doc));
};

export const updateIncomeEntry = async (id: string, updates: Partial<Omit<IncomeEntry, 'id'>>): Promise<void> => {
  const docRef = doc(incomeEntriesRef, id);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: Timestamp.now(),
  });
};

export const deleteIncomeEntry = async (id: string): Promise<void> => {
  const docRef = doc(incomeEntriesRef, id);
  await deleteDoc(docRef);
};
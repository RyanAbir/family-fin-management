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
import type { IncomeEntry } from "@/types";

const incomeConverter = {
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
      date: data?.date?.toDate() || new Date(),
      createdAt: data?.createdAt?.toDate() || new Date(),
      updatedAt: data?.updatedAt?.toDate() || new Date(),
    } as IncomeEntry;
  },
};

const incomeRef = collection(db, "income_entries").withConverter(incomeConverter);

export const getIncomeEntry = async (id: string): Promise<IncomeEntry | null> => {
  const docRef = doc(incomeRef, id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? incomeConverter.fromFirestore(docSnap) : null;
};

export const getAllIncomeEntries = async (): Promise<IncomeEntry[]> => {
  const q = query(incomeRef, orderBy("date", "desc"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => incomeConverter.fromFirestore(doc));
};

export const getPropertyIncome = async (propertyId: string): Promise<IncomeEntry[]> => {
  const q = query(incomeRef, where("propertyId", "==", propertyId), orderBy("date", "desc"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => incomeConverter.fromFirestore(doc));
};

export const getMonthlyIncome = async (propertyId: string, monthKey: string): Promise<IncomeEntry[]> => {
  const q = query(
    incomeRef,
    where("propertyId", "==", propertyId),
    where("monthKey", "==", monthKey),
    orderBy("date", "desc")
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => incomeConverter.fromFirestore(doc));
};

export const createIncomeEntry = async (entry: Omit<IncomeEntry, 'id'>): Promise<IncomeEntry> => {
  const docRef = await addDoc(incomeRef, entry);
  const docSnap = await getDoc(docRef);
  return incomeConverter.fromFirestore(docSnap);
};

export const updateIncomeEntry = async (id: string, updates: Partial<Omit<IncomeEntry, 'id'>>): Promise<void> => {
  const docRef = doc(incomeRef, id);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: Timestamp.now(),
  });
};

export const deleteIncomeEntry = async (id: string): Promise<void> => {
  const docRef = doc(incomeRef, id);
  await deleteDoc(docRef);
};

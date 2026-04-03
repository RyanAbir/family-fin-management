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
import type { Property } from "@/types";

const propertyConverter = {
  toFirestore: (property: Omit<Property, 'id'>) => ({
    ...property,
    createdAt: Timestamp.fromDate(property.createdAt),
    updatedAt: Timestamp.fromDate(property.updatedAt),
  }),
  fromFirestore: (snapshot: DocumentSnapshot<DocumentData>): Property => {
    const data = snapshot.data();
    return {
      id: snapshot.id,
      ...data,
      createdAt: data?.createdAt?.toDate() || new Date(),
      updatedAt: data?.updatedAt?.toDate() || new Date(),
    } as Property;
  },
};

const propertiesRef = collection(db, "properties").withConverter(propertyConverter);

export const getProperty = async (id: string): Promise<Property | null> => {
  const docRef = doc(propertiesRef, id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? propertyConverter.fromFirestore(docSnap) : null;
};

export const getAllProperties = async (): Promise<Property[]> => {
  const q = query(propertiesRef, orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => propertyConverter.fromFirestore(doc));
};

export const getActiveProperties = async (): Promise<Property[]> => {
  const q = query(propertiesRef, where("isActive", "==", true), orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => propertyConverter.fromFirestore(doc));
};

export const createProperty = async (property: Omit<Property, 'id'>): Promise<Property> => {
  const docRef = await addDoc(propertiesRef, property);
  const docSnap = await getDoc(docRef);
  return propertyConverter.fromFirestore(docSnap);
};

export const updateProperty = async (id: string, updates: Partial<Omit<Property, 'id'>>): Promise<void> => {
  const docRef = doc(propertiesRef, id);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: Timestamp.now(),
  });
};

export const deleteProperty = async (id: string): Promise<void> => {
  const docRef = doc(propertiesRef, id);
  await deleteDoc(docRef);
};

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
import type { Property } from "../../types";

const PROPERTIES_COLLECTION = "properties";

const removeUndefinedFields = <T extends Record<string, unknown>>(value: T): T => {
  return Object.fromEntries(
    Object.entries(value).filter(([, fieldValue]) => fieldValue !== undefined)
  ) as T;
};

// Firestore converters

// Firestore converters
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
      createdAt: data?.createdAt && typeof data.createdAt.toDate === 'function' ? data.createdAt.toDate() : (data?.createdAt instanceof Date ? data.createdAt : new Date()),
      updatedAt: data?.updatedAt && typeof data.updatedAt.toDate === 'function' ? data.updatedAt.toDate() : (data?.updatedAt instanceof Date ? data.updatedAt : new Date()),
    } as Property;
  },
};

const propertiesRef = collection(db, PROPERTIES_COLLECTION).withConverter(propertyConverter);

// CRUD operations
export const createProperty = async (property: Omit<Property, 'id'>): Promise<Property> => {
  const payload = removeUndefinedFields({
    code: property.code,
    name: property.name,
    type: property.type,
    location: property.location,
    expectedRent: property.expectedRent,
    notes: property.notes,
    isActive: property.isActive,
    createdAt: property.createdAt,
    updatedAt: property.updatedAt,
  });

  console.log("createProperty: collection", PROPERTIES_COLLECTION);
  console.log("createProperty: payload", payload);
  try {
    const docRef = await addDoc(propertiesRef, payload as Omit<Property, "id">);
    console.log("createProperty: returned document id", docRef.id);
    const docSnap = await getDoc(docRef);
    const createdProperty = propertyConverter.fromFirestore(docSnap);
    console.log("createProperty: property document created", createdProperty);
    return createdProperty;
  } catch (error) {
    console.log("createProperty: failed to create property document", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown Firestore error";
    throw new Error(
      `Failed to create property in '${PROPERTIES_COLLECTION}': ${errorMessage}`
    );
  }
};

export const getProperty = async (id: string): Promise<Property | null> => {
  const docRef = doc(propertiesRef, id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? propertyConverter.fromFirestore(docSnap) : null;
};

export const getAllProperties = async (): Promise<Property[]> => {
  try {
    const q = query(propertiesRef);
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => propertyConverter.fromFirestore(doc));
  } catch (error) {
    console.error("Error in getAllProperties:", error);
    throw error;
  }
};

export const getActiveProperties = async (): Promise<Property[]> => {
  const q = query(propertiesRef, where("isActive", "==", true));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => propertyConverter.fromFirestore(doc));
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

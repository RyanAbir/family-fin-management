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
import type { OwnershipShare } from "@/types";

const ownershipShareConverter = {
  toFirestore: (share: Omit<OwnershipShare, 'id'>) => ({
    ...share,
    createdAt: Timestamp.fromDate(share.createdAt),
    updatedAt: Timestamp.fromDate(share.updatedAt),
  }),
  fromFirestore: (snapshot: DocumentSnapshot<DocumentData>): OwnershipShare => {
    const data = snapshot.data();
    return {
      id: snapshot.id,
      ...data,
      createdAt: data?.createdAt?.toDate() || new Date(),
      updatedAt: data?.updatedAt?.toDate() || new Date(),
    } as OwnershipShare;
  },
};

const sharesRef = collection(db, "ownership_shares").withConverter(ownershipShareConverter);

export const getOwnershipShare = async (id: string): Promise<OwnershipShare | null> => {
  const docRef = doc(sharesRef, id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? ownershipShareConverter.fromFirestore(docSnap) : null;
};

export const getAllOwnershipShares = async (): Promise<OwnershipShare[]> => {
  const q = query(sharesRef, orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ownershipShareConverter.fromFirestore(doc));
};

export const getPropertyShares = async (propertyId: string): Promise<OwnershipShare[]> => {
  const q = query(sharesRef, where("propertyId", "==", propertyId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ownershipShareConverter.fromFirestore(doc));
};

export const getMemberShares = async (memberId: string): Promise<OwnershipShare[]> => {
  const q = query(sharesRef, where("memberId", "==", memberId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ownershipShareConverter.fromFirestore(doc));
};

export const createOwnershipShare = async (share: Omit<OwnershipShare, 'id'>): Promise<OwnershipShare> => {
  const docRef = await addDoc(sharesRef, share);
  const docSnap = await getDoc(docRef);
  return ownershipShareConverter.fromFirestore(docSnap);
};

export const updateOwnershipShare = async (id: string, updates: Partial<Omit<OwnershipShare, 'id'>>): Promise<void> => {
  const docRef = doc(sharesRef, id);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: Timestamp.now(),
  });
};

export const deleteOwnershipShare = async (id: string): Promise<void> => {
  const docRef = doc(sharesRef, id);
  await deleteDoc(docRef);
};

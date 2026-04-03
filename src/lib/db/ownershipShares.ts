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
import type { OwnershipShare, FamilyMember } from "../../types";
import { calculateShariahPercentages } from "../utils/shariah";

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
      createdAt: data?.createdAt && typeof data.createdAt.toDate === 'function' ? data.createdAt.toDate() : (data?.createdAt instanceof Date ? data.createdAt : new Date()),
      updatedAt: data?.updatedAt && typeof data.updatedAt.toDate === 'function' ? data.updatedAt.toDate() : (data?.updatedAt instanceof Date ? data.updatedAt : new Date()),
    } as OwnershipShare;
  },
};

const ownershipSharesRef = collection(db, "ownership_shares").withConverter(ownershipShareConverter);

// CRUD operations
export const createOwnershipShare = async (share: Omit<OwnershipShare, 'id'>): Promise<OwnershipShare> => {
  const docRef = await addDoc(ownershipSharesRef, share);
  const docSnap = await getDoc(docRef);
  return ownershipShareConverter.fromFirestore(docSnap);
};

export const getOwnershipShare = async (id: string): Promise<OwnershipShare | null> => {
  const docRef = doc(ownershipSharesRef, id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? ownershipShareConverter.fromFirestore(docSnap) : null;
};

export const getAllOwnershipShares = async (): Promise<OwnershipShare[]> => {
  const q = query(ownershipSharesRef);
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ownershipShareConverter.fromFirestore(doc));
};

export const getOwnershipSharesByProperty = async (propertyId: string): Promise<OwnershipShare[]> => {
  const q = query(ownershipSharesRef, where("propertyId", "==", propertyId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ownershipShareConverter.fromFirestore(doc));
};

export const getOwnershipSharesByMember = async (memberId: string): Promise<OwnershipShare[]> => {
  const q = query(ownershipSharesRef, where("memberId", "==", memberId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ownershipShareConverter.fromFirestore(doc));
};

export const updateOwnershipShare = async (id: string, updates: Partial<Omit<OwnershipShare, 'id'>>): Promise<void> => {
  const docRef = doc(ownershipSharesRef, id);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: Timestamp.now(),
  });
};

export const deleteOwnershipShare = async (id: string): Promise<void> => {
  const docRef = doc(ownershipSharesRef, id);
  await deleteDoc(docRef);
};

/**
 * Ensures all members are linked to a property and redistributes shares based on Shariah rule.
 */
export const syncSharesForProperty = async (propertyId: string, allMembers: FamilyMember[]): Promise<void> => {
  // 1. Get current shares
  const currentShares = await getOwnershipSharesByProperty(propertyId);
  const memberIdsWithShares = new Set(currentShares.map(s => s.memberId));

  // 2. Add missing members (0% initial)
  for (const member of allMembers) {
    if (!memberIdsWithShares.has(member.id)) {
      await createOwnershipShare({
        propertyId,
        memberId: member.id,
        percentage: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  // 3. Fetch final list and redistribute
  const finalShares = await getOwnershipSharesByProperty(propertyId);
  const rebalanced = calculateShariahPercentages(finalShares, allMembers);

  await Promise.all(rebalanced.map(item => 
    updateOwnershipShare(item.id, { percentage: item.percentage })
  ));
};
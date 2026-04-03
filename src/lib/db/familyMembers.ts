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
import type { FamilyMember } from "../../types";
import { getAllProperties } from "./properties";
import { syncSharesForProperty } from "./ownershipShares";

const FAMILY_MEMBERS_COLLECTION = "family_members";

const familyMemberConverter = {
  toFirestore: (member: Omit<FamilyMember, 'id'>) => ({
    ...member,
    createdAt: Timestamp.fromDate(member.createdAt),
    updatedAt: Timestamp.fromDate(member.updatedAt),
  }),
  fromFirestore: (snapshot: DocumentSnapshot<DocumentData>): FamilyMember => {
    const data = snapshot.data();
    return {
      id: snapshot.id,
      ...data,
      createdAt: data?.createdAt && typeof data.createdAt.toDate === 'function' ? data.createdAt.toDate() : (data?.createdAt instanceof Date ? data.createdAt : new Date()),
      updatedAt: data?.updatedAt && typeof data.updatedAt.toDate === 'function' ? data.updatedAt.toDate() : (data?.updatedAt instanceof Date ? data.updatedAt : new Date()),
    } as FamilyMember;
  },
};

const familyMembersRef = collection(db, FAMILY_MEMBERS_COLLECTION).withConverter(familyMemberConverter);

// CRUD operations
export const createFamilyMember = async (member: Omit<FamilyMember, 'id'>): Promise<FamilyMember> => {
  const payload: Omit<FamilyMember, "id"> = {
    ...member,
    createdAt: member.createdAt || new Date(),
    updatedAt: member.updatedAt || new Date(),
  };

  console.log("createFamilyMember: collection", FAMILY_MEMBERS_COLLECTION);
  console.log("createFamilyMember: payload", payload);
  try {
    const docRef = await addDoc(familyMembersRef, payload);
    const createdMember: FamilyMember = {
      id: docRef.id,
      ...payload,
    };

    // 🏆 Automation: Link new member to all existing properties instantly
    console.log("createFamilyMember: triggering share auto-generation...");
    const properties = await getAllProperties();
    const allMembers = await getAllFamilyMembers(); // Need all for Shariah math
    
    // Use for loop with await for sequential sync (safer for Firestore)
    for (const prop of properties) {
      await syncSharesForProperty(prop.id, allMembers);
    }

    console.log("createFamilyMember: family member document created and shares synced", createdMember);
    return createdMember;
  } catch (error) {
    console.log("createFamilyMember: failed to create family member document", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown Firestore error";
    throw new Error(
      `Failed to create family member in '${FAMILY_MEMBERS_COLLECTION}': ${errorMessage}`
    );
  }
};

export const getFamilyMember = async (id: string): Promise<FamilyMember | null> => {
  const docRef = doc(familyMembersRef, id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? familyMemberConverter.fromFirestore(docSnap) : null;
};

export const getAllFamilyMembers = async (): Promise<FamilyMember[]> => {
  try {
    const q = query(familyMembersRef); // removed orderBy
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => familyMemberConverter.fromFirestore(doc));
  } catch (error) {
    console.error("Error in getAllFamilyMembers:", error);
    throw error;
  }
};

export const getActiveFamilyMembers = async (): Promise<FamilyMember[]> => {
  const q = query(familyMembersRef, where("isActive", "==", true));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => familyMemberConverter.fromFirestore(doc));
};

export const updateFamilyMember = async (id: string, updates: Partial<Omit<FamilyMember, 'id'>>): Promise<void> => {
  const docRef = doc(familyMembersRef, id);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: Timestamp.now(),
  });
};

export const deleteFamilyMember = async (id: string): Promise<void> => {
  const docRef = doc(familyMembersRef, id);
  await deleteDoc(docRef);
};

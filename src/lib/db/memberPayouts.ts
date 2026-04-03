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
  Timestamp,
  DocumentSnapshot,
  DocumentData
} from "firebase/firestore";
import { db } from "../firebase";
import type { MemberPayout } from "../../types";

const memberPayoutConverter = {
  toFirestore: (payout: Omit<MemberPayout, 'id'>) => ({
    ...payout,
    date: Timestamp.fromDate(payout.date),
    createdAt: Timestamp.fromDate(payout.createdAt),
    updatedAt: Timestamp.fromDate(payout.updatedAt),
  }),
  fromFirestore: (snapshot: DocumentSnapshot<DocumentData>): MemberPayout => {
    const data = snapshot.data();
    return {
      id: snapshot.id,
      ...data,
      date: data?.date && typeof data.date.toDate === 'function' ? data.date.toDate() : (data?.date instanceof Date ? data.date : new Date()),
      createdAt: data?.createdAt && typeof data.createdAt.toDate === 'function' ? data.createdAt.toDate() : (data?.createdAt instanceof Date ? data.createdAt : new Date()),
      updatedAt: data?.updatedAt && typeof data.updatedAt.toDate === 'function' ? data.updatedAt.toDate() : (data?.updatedAt instanceof Date ? data.updatedAt : new Date()),
    } as MemberPayout;
  },
};

const memberPayoutsRef = collection(db, "member_payouts").withConverter(memberPayoutConverter);

// CRUD operations
export const createMemberPayout = async (payout: Omit<MemberPayout, 'id'>): Promise<MemberPayout> => {
  const docRef = await addDoc(memberPayoutsRef, payout);
  const docSnap = await getDoc(docRef);
  return memberPayoutConverter.fromFirestore(docSnap);
};

export const getMemberPayout = async (id: string): Promise<MemberPayout | null> => {
  const docRef = doc(memberPayoutsRef, id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? memberPayoutConverter.fromFirestore(docSnap) : null;
};

export const getAllMemberPayouts = async (): Promise<MemberPayout[]> => {
  const q = query(memberPayoutsRef);
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => memberPayoutConverter.fromFirestore(doc));
};

export const getMemberPayoutsByMember = async (memberId: string): Promise<MemberPayout[]> => {
  const q = query(memberPayoutsRef, where("memberId", "==", memberId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => memberPayoutConverter.fromFirestore(doc));
};

export const getMemberPayoutsByMonth = async (monthKey: string): Promise<MemberPayout[]> => {
  const q = query(memberPayoutsRef, where("monthKey", "==", monthKey));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => memberPayoutConverter.fromFirestore(doc));
};

export const updateMemberPayout = async (id: string, updates: Partial<Omit<MemberPayout, 'id'>>): Promise<void> => {
  const docRef = doc(memberPayoutsRef, id);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: Timestamp.now(),
  });
};

export const deleteMemberPayout = async (id: string): Promise<void> => {
  const docRef = doc(memberPayoutsRef, id);
  await deleteDoc(docRef);
};

import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  updateDoc, 
  doc, 
  serverTimestamp, 
  getDoc,
  limit,
  Timestamp
} from "firebase/firestore";
import { db } from "../firebase";
import { Invitation, UserRole } from "@/types";

const INVITES_COLLECTION = "invitations";

// Create a new invitation token
export const createInvitation = async (inviterUid: string, inviterName: string, role: UserRole = "member") => {
  const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiry

  const inviteData = {
    token,
    role,
    inviterUid,
    inviterName,
    expiresAt: Timestamp.fromDate(expiresAt),
    used: false,
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, INVITES_COLLECTION), inviteData);
  return { id: docRef.id, token };
};

// Validate an invitation token
export const validateInvitation = async (token: string) => {
  const q = query(
    collection(db, INVITES_COLLECTION),
    where("token", "==", token),
    where("used", "==", false),
    limit(1)
  );

  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) {
    return { valid: false, message: "Invalid or used invitation link." };
  }

  const inviteDoc = querySnapshot.docs[0];
  const inviteData = inviteDoc.data();
  
  // Check expiry
  const expiresAt = inviteData.expiresAt.toDate();
  if (expiresAt < new Date()) {
    return { valid: false, message: "Invitation link has expired." };
  }

  return { 
    valid: true, 
    invite: { id: inviteDoc.id, ...inviteData } as Invitation 
  };
};

// Use an invitation
export const useInvitation = async (inviteId: string, usedByUid: string) => {
  const inviteRef = doc(db, INVITES_COLLECTION, inviteId);
  await updateDoc(inviteRef, {
    used: true,
    usedBy: usedByUid,
    updatedAt: serverTimestamp(),
  });
  
  // Upgrade user role
  const inviteSnap = await getDoc(inviteRef);
  const inviteData = inviteSnap.data() as Invitation;
  
  const userProfileRef = doc(db, "userProfiles", usedByUid);
  await updateDoc(userProfileRef, {
    role: inviteData.role,
    updatedAt: serverTimestamp(),
  });
};

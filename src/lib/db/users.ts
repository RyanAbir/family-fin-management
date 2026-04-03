import { 
  doc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp 
} from "firebase/firestore";
import { db } from "../firebase";
import { UserRole } from "@/types";

/**
 * Updates a user's role in the database.
 * Only should be called by an Admin.
 */
export const updateUserRole = async (uid: string, newRole: UserRole) => {
  const userRef = doc(db, "userProfiles", uid);
  await updateDoc(userRef, {
    role: newRole,
    updatedAt: serverTimestamp(),
  });
};

/**
 * Updates a user's visual profile data.
 * Can be called by the user themselves.
 */
export const updateUserProfileData = async (uid: string, data: { displayName: string, photoURL?: string }) => {
  const userRef = doc(db, "userProfiles", uid);
  await updateDoc(userRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

/**
 * Permanently deletes a user's record from the database.
 * Only should be called by a Super Admin.
 */
export const deleteUserProfile = async (uid: string) => {
  const userRef = doc(db, "userProfiles", uid);
  await deleteDoc(userRef);
};

import { 
  collection,
  deleteField,
  getDocs,
  getDoc,
  orderBy,
  query,
  doc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp,
  Timestamp,
  DocumentData,
  DocumentReference,
  FieldValue,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
import { UserProfile, UserRole } from "@/types";

const toDate = (value: unknown): Date => {
  if (value instanceof Date) return value;
  if (value instanceof Timestamp) return value.toDate();
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof value.toDate === "function"
  ) {
    return value.toDate();
  }
  return new Date();
};

const userProfileFromData = (data: DocumentData, fallbackUid: string): UserProfile => ({
  uid: typeof data.uid === "string" ? data.uid : fallbackUid,
  email: typeof data.email === "string" ? data.email : "",
  displayName: typeof data.displayName === "string" ? data.displayName : "Unknown User",
  photoURL: typeof data.photoURL === "string" ? data.photoURL : undefined,
  role: typeof data.role === "string" ? (data.role as UserRole) : "viewer",
  gender: data.gender === "male" || data.gender === "female" ? data.gender : undefined,
  relation:
    data.relation === "son" ||
    data.relation === "daughter" ||
    data.relation === "mother" ||
    data.relation === "other"
      ? data.relation
      : undefined,
  familyMemberId: typeof data.familyMemberId === "string" ? data.familyMemberId : undefined,
  linkedFamilyMemberId: typeof data.linkedFamilyMemberId === "string" ? data.linkedFamilyMemberId : undefined,
  assignedFamilyMemberId: typeof data.assignedFamilyMemberId === "string" ? data.assignedFamilyMemberId : undefined,
  assignedAt: data.assignedAt ? toDate(data.assignedAt) : undefined,
  assignedBy: typeof data.assignedBy === "string" ? data.assignedBy : undefined,
  createdAt: toDate(data.createdAt),
  updatedAt: toDate(data.updatedAt),
});

export const getAllUserProfiles = async (): Promise<UserProfile[]> => {
  const q = query(collection(db, "userProfiles"), orderBy("role"), orderBy("displayName"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((snapshot) => userProfileFromData(snapshot.data(), snapshot.id));
};

const addMemberRef = (refs: Map<string, DocumentReference<DocumentData>>, memberId: unknown) => {
  if (typeof memberId === "string" && memberId.length > 0) {
    refs.set(memberId, doc(db, "family_members", memberId));
  }
};

const unlinkUserFromFamilyMember = async (uid: string, userData: DocumentData): Promise<void> => {
  const memberRefs = new Map<string, DocumentReference<DocumentData>>();

  addMemberRef(memberRefs, userData.familyMemberId);
  addMemberRef(memberRefs, userData.linkedFamilyMemberId);
  addMemberRef(memberRefs, userData.assignedFamilyMemberId);

  const [linkedUserIdSnapshot, linkedUidSnapshot] = await Promise.all([
    getDocs(query(collection(db, "family_members"), where("linkedUserId", "==", uid))),
    getDocs(query(collection(db, "family_members"), where("linkedUid", "==", uid))),
  ]);

  linkedUserIdSnapshot.docs.forEach((snapshot) => memberRefs.set(snapshot.id, snapshot.ref));
  linkedUidSnapshot.docs.forEach((snapshot) => memberRefs.set(snapshot.id, snapshot.ref));

  const memberUnlinkData: Record<string, FieldValue> = {
    linkedUserId: deleteField(),
    linkedUid: deleteField(),
    linkedEmail: deleteField(),
    assignedAt: deleteField(),
    assignedBy: deleteField(),
  };

  await Promise.allSettled(
    Array.from(memberRefs.values()).map(async (memberRef) => {
      try {
        await updateDoc(memberRef, memberUnlinkData);
      } catch (error: unknown) {
        // Ignore "not-found" errors if the family member was already deleted
        if (typeof error === 'object' && error !== null && 'code' in error && (error as { code: string }).code !== 'not-found') {
          console.error("Error unlinking family member:", error);
        } else if (!(typeof error === 'object' && error !== null && 'code' in error)) {
          console.error("Error unlinking family member:", error);
        }
      }
    })
  );
};

/**
 * Updates a user's role in the database.
 * Only should be called by an Admin.
 */
export const updateUserRole = async (uid: string, newRole: UserRole) => {
  const userRef = doc(db, "userProfiles", uid);
  const userSnapshot = await getDoc(userRef);

  if (!userSnapshot.exists()) {
    throw new Error("User profile not found.");
  }

  const userData = userSnapshot.data();
  const isResetToViewer = newRole === "viewer" && Boolean(
    userData.familyMemberId || userData.linkedFamilyMemberId || userData.assignedFamilyMemberId || userData.role === "member"
  );

  if (isResetToViewer) {
    await unlinkUserFromFamilyMember(uid, userData);
  }

  await updateDoc(userRef, {
    role: newRole,
    ...(isResetToViewer
      ? {
          familyMemberId: deleteField(),
          linkedFamilyMemberId: deleteField(),
          assignedFamilyMemberId: deleteField(),
          relation: deleteField(),
          assignedAt: deleteField(),
          assignedBy: deleteField(),
        }
      : {}),
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

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
  runTransaction,
  Timestamp,
  DocumentSnapshot,
  DocumentData,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import type { FamilyMember } from "../../types";
import { getAllProperties } from "./properties";
import { syncSharesForProperty } from "./ownershipShares";

const FAMILY_MEMBERS_COLLECTION = "family_members";

const familyMemberConverter = {
  toFirestore: (member: Omit<FamilyMember, 'id'>) => {
    const data: Record<string, unknown> = {
      ...member,
      createdAt: Timestamp.fromDate(member.createdAt),
      updatedAt: Timestamp.fromDate(member.updatedAt),
    };

    if (member.assignedAt) {
      data.assignedAt = Timestamp.fromDate(member.assignedAt);
    } else {
      delete data.assignedAt;
    }

    return data;
  },
  fromFirestore: (snapshot: DocumentSnapshot<DocumentData>): FamilyMember => {
    const data = snapshot.data();
    return {
      id: snapshot.id,
      ...data,
      createdAt: data?.createdAt && typeof data.createdAt.toDate === 'function' ? data.createdAt.toDate() : (data?.createdAt instanceof Date ? data.createdAt : new Date()),
      updatedAt: data?.updatedAt && typeof data.updatedAt.toDate === 'function' ? data.updatedAt.toDate() : (data?.updatedAt instanceof Date ? data.updatedAt : new Date()),
      assignedAt: data?.assignedAt && typeof data.assignedAt.toDate === 'function' ? data.assignedAt.toDate() : (data?.assignedAt instanceof Date ? data.assignedAt : undefined),
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
  const { assignedAt, ...rest } = updates;
  await updateDoc(docRef, {
    ...rest,
    ...(assignedAt ? { assignedAt: Timestamp.fromDate(assignedAt) } : {}),
    updatedAt: Timestamp.now(),
  });
};

export const deleteFamilyMember = async (id: string): Promise<void> => {
  const docRef = doc(familyMembersRef, id);
  await deleteDoc(docRef);
};

interface AssignmentInput {
  userId: string;
  familyMemberId: string;
  assignedBy: string;
}

interface CreateAndAssignInput {
  userId: string;
  assignedBy: string;
  member: Omit<FamilyMember, "id" | "linkedUid" | "linkedUserId" | "linkedEmail" | "assignedAt" | "assignedBy">;
}

const getLinkedUserId = (member: FamilyMember): string | undefined => member.linkedUserId ?? member.linkedUid;

const ensureUserUnassigned = async (userId: string): Promise<void> => {
  const [membersSnapshot, legacyMembersSnapshot] = await Promise.all([
    getDocs(query(familyMembersRef, where("linkedUserId", "==", userId))),
    getDocs(query(familyMembersRef, where("linkedUid", "==", userId))),
  ]);

  if (!membersSnapshot.empty || !legacyMembersSnapshot.empty) {
    throw new Error("This user is already assigned to a family member.");
  }
};

const ensureAssignable = async (userId: string, familyMemberId: string): Promise<void> => {
  const usersSnapshot = await getDocs(
    query(collection(db, "userProfiles"), where("familyMemberId", "==", familyMemberId))
  );

  await ensureUserUnassigned(userId);

  const hasActiveAssignedUser = usersSnapshot.docs.some((snapshot) => {
    const data = snapshot.data();
    return snapshot.id !== userId && data.role === "member";
  });

  if (hasActiveAssignedUser) {
    throw new Error("This family member is already assigned to a user.");
  }
};

export const assignUserToFamilyMember = async ({
  userId,
  familyMemberId,
  assignedBy,
}: AssignmentInput): Promise<void> => {
  await ensureAssignable(userId, familyMemberId);

  const userRef = doc(db, "userProfiles", userId);
  const memberRef = doc(familyMembersRef, familyMemberId);

  await runTransaction(db, async (transaction) => {
    const [userSnap, memberSnap] = await Promise.all([
      transaction.get(userRef),
      transaction.get(memberRef),
    ]);

    if (!userSnap.exists()) {
      throw new Error("Selected user no longer exists.");
    }

    if (!memberSnap.exists()) {
      throw new Error("Selected family member no longer exists.");
    }

    const userData = userSnap.data();
    const memberData = memberSnap.data();
    const member = familyMemberConverter.fromFirestore(memberSnap);

    if (
      typeof userData.familyMemberId === "string" &&
      userData.familyMemberId.length > 0 &&
      userData.role !== "viewer"
    ) {
      throw new Error("This user is already assigned to a family member.");
    }

    if (getLinkedUserId(member)) {
      throw new Error("This family member is already assigned to a user.");
    }

    const linkedEmail = typeof userData.email === "string" ? userData.email : "";
    const relation = memberData.relation;

    transaction.update(memberRef, {
      linkedUserId: userId,
      linkedUid: userId,
      linkedEmail,
      assignedAt: serverTimestamp(),
      assignedBy,
      updatedAt: serverTimestamp(),
    });

    const userUpdate: Record<string, unknown> = {
      role: "member",
      familyMemberId,
      assignedAt: serverTimestamp(),
      assignedBy,
      updatedAt: serverTimestamp(),
    };

    if (typeof relation === "string") {
      userUpdate.relation = relation;
    }

    transaction.update(userRef, userUpdate);
  });
};

export const createFamilyMemberAndAssignUser = async ({
  userId,
  assignedBy,
  member,
}: CreateAndAssignInput): Promise<FamilyMember> => {
  await ensureUserUnassigned(userId);
  const createdMember = await createFamilyMember(member);
  await assignUserToFamilyMember({
    userId,
    familyMemberId: createdMember.id,
    assignedBy,
  });
  return createdMember;
};

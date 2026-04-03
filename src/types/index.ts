export interface Property {
  id: string;
  code?: string;
  name: string;
  type: string;
  location: string;
  expectedRent?: number;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FamilyMember {
  id: string;
  name: string;
  isActive: boolean;
  relation: "son" | "daughter" | "mother" | "other";
  gender?: "male" | "female";
  linkedUid?: string;
  linkedEmail?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OwnershipShare {
  id: string;
  propertyId: string;
  memberId: string;
  percentage: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IncomeEntry {
  id: string;
  propertyId: string;
  date: Date;
  monthKey: string; // Format: YYYY-MM
  category: string;
  description?: string;
  amount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExpenseEntry {
  id: string;
  propertyId: string;
  date: Date;
  monthKey: string; // Format: YYYY-MM
  category: string;
  description?: string;
  amount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Firestore timestamp type for conversion
export interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
}

// Base interface for Firestore documents
export interface FirestoreDoc {
  id: string;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export interface MemberPayout {
  id: string;
  memberId: string;
  date: Date;
  monthKey: string; // Format: YYYY-MM
  amount: number;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = "super_admin" | "admin" | "member" | "viewer" | "banned";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  gender?: "male" | "female";
  relation?: "son" | "daughter" | "mother" | "other";
  familyMemberId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type NotificationType = "income" | "expense" | "payout" | "property" | "member" | "share";

export interface AppNotification {
  id: string;
  message: string;
  type: NotificationType;
  targetId?: string;
  targetTab?: string;
  creatorName: string;
  readBy: string[]; // Array of UIDs
  createdAt: Date;
}

export interface Invitation {
  id: string;
  token: string;
  role: UserRole;
  inviterUid: string;
  inviterName: string;
  expiresAt: Date;
  used: boolean;
  usedBy?: string; // UID
  createdAt: Date;
}
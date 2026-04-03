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
// Core entity types for the property finance system

export interface Property {
  id: string;
  name: string;
  address: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FamilyMember {
  id: string;
  name: string;
  email?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OwnershipShare {
  id: string;
  propertyId: string;
  memberId: string;
  sharePercentage: number; // e.g., 0.25 for 25%
  createdAt: Date;
  updatedAt: Date;
}

export interface IncomeEntry {
  id: string;
  propertyId: string;
  amount: number;
  date: Date;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExpenseEntry {
  id: string;
  propertyId: string;
  amount: number;
  date: Date;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

// Computed types for financial summaries and distributions

export interface PropertyFinancialSummary {
  propertyId: string;
  propertyName: string;
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  ownershipShares: OwnershipShare[];
}

export interface PropertyMonthlySummary {
  propertyId: string;
  propertyName: string;
  monthKey: string; // Format: YYYY-MM, e.g., "2026-04"
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
}

export interface MemberDistribution {
  memberId: string;
  memberName: string;
  totalShare: number;
  // Running balance fields
  previousRolloverBalance: number; // cumulative balance before the selected month
  thisMonthEarnings: number;       // property share earned specifically this month
  thisMonthPayouts: number;        // amount withdrawn this month
  currentNetBalance: number;       // previousRolloverBalance + thisMonthEarnings - thisMonthPayouts
  properties: {
    propertyId: string;
    propertyName: string;
    shareAmount: number;
  }[];
}

export interface FamilyEarningsSummary {
  totalFamilyIncome: number;
  totalFamilyExpenses: number;
  netFamilyIncome: number;
  memberSummaries: MemberDistribution[];
}

export interface DistributionWarning {
  propertyId: string;
  propertyName: string;
  issue: "NO_SHARES" | "INVALID_SHARE_TOTAL" | "MISSING_MEMBER";
  message: string;
}

export interface DistributionComputationResult {
  rows: MemberDistribution[];
  warnings: DistributionWarning[];
}

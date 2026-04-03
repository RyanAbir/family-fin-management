import type { Property, FamilyMember, OwnershipShare } from "@/types";

/**
 * Summary for a single property across all time
 */
export interface PropertySummary {
  property: Property;
  totalIncome: number;
  totalExpense: number;
  netIncome: number;
  expectedRent?: number;
  varianceFromExpectedRent?: number; // expectedRent - netIncome
}

/**
 * Summary for a property in a specific month
 */
export interface MonthlySummary {
  propertyId: string;
  propertyName: string;
  monthKey: string;
  totalIncome: number;
  totalExpense: number;
  netIncome: number;
}

/**
 * Distribution of property net income to a family member
 */
export interface MemberShare {
  memberId: string;
  memberName: string;
  percentage: number;
  shareAmount: number; // netIncome * percentage
}

/**
 * Property distribution breakdown
 */
export interface PropertyDistribution {
  property: Property;
  netIncome: number;
  members: MemberShare[];
  totalDistributed: number; // Sum of all member shares
}

/**
 * Overall family member summary across all properties
 */
export interface FamilyMemberSummary {
  member: FamilyMember;
  totalShareIncome: number;
  propertiesParticipated: Property[];
  propertyBreakdown: {
    propertyId: string;
    propertyName: string;
    percentage: number;
    shareAmount: number;
  }[];
}

/**
 * Dashboard overview
 */
export interface DashboardSummary {
  totalNetIncome: number;
  totalDistributedAmount: number;
  activePropertiesCount: number;
  activeFamilyMembersCount: number;
  propertyDistributions: PropertyDistribution[];
  familyMemberSummaries: FamilyMemberSummary[];
}

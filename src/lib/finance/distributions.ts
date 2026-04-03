import type {
  PropertyFinancialSummary,
  PropertyMonthlySummary,
  OwnershipShare,
  FamilyMember,
  MemberDistribution,
  FamilyEarningsSummary,
  DistributionWarning,
} from "./types";
import { round2, groupBy } from "./helpers";

export interface PropertyDistributionResult {
  propertyId: string;
  propertyName: string;
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  distributions: {
    memberId: string;
    memberName: string;
    sharePercentage: number;
    distributionAmount: number;
  }[];
}

export interface DistributionCalculationResult {
  distributions: PropertyDistributionResult[];
  warnings: DistributionWarning[];
}

/**
 * Calculate distribution per property based on property net income and ownership shares
 */
export const calculatePropertyDistributions = (
  propertySummaries: PropertyFinancialSummary[],
  ownershipShares: OwnershipShare[],
  familyMembers: FamilyMember[]
): DistributionCalculationResult => {
  const memberMap = new Map(familyMembers.map((m) => [m.id, m]));
  const sharesByProperty = groupBy(ownershipShares, (share) => share.propertyId);

  const distributions: PropertyDistributionResult[] = [];
  const warnings: DistributionWarning[] = [];

  for (const summary of propertySummaries) {
    const shares = sharesByProperty[summary.propertyId] || [];
    const validShares: OwnershipShare[] = [];

    for (const share of shares) {
      if (memberMap.has(share.memberId)) {
        validShares.push(share);
      } else {
        warnings.push({ propertyId: summary.propertyId, propertyName: summary.propertyName, issue: "MISSING_MEMBER", message: `Member ${share.memberId} not found` });
      }
    }

    const totalSharePercentage = validShares.reduce((sum, share) => sum + share.sharePercentage, 0);
    if (validShares.length > 0 && Math.abs(totalSharePercentage - 1) > 0.01) {
      warnings.push({ propertyId: summary.propertyId, propertyName: summary.propertyName, issue: "INVALID_SHARE_TOTAL", message: `Shares sum to ${Math.round(totalSharePercentage * 100)}%` });
    }

    const propertyDistributions = validShares.map((share) => {
      const member = memberMap.get(share.memberId)!;
      const distributionAmount = round2(summary.netIncome * share.sharePercentage);
      return { memberId: share.memberId, memberName: member.name, sharePercentage: share.sharePercentage, distributionAmount };
    });

    distributions.push({
      propertyId: summary.propertyId,
      propertyName: summary.propertyName,
      totalIncome: summary.totalIncome,
      totalExpenses: summary.totalExpenses,
      netIncome: summary.netIncome,
      distributions: propertyDistributions,
    });
  }

  return { distributions, warnings };
};

/**
 * Calculate monthly distribution per property and member
 */
export const calculateMonthlyDistributions = (
  monthlySummaries: PropertyMonthlySummary[],
  ownershipShares: OwnershipShare[],
  familyMembers: FamilyMember[]
): DistributionCalculationResult => {
  const memberMap = new Map(familyMembers.map((m) => [m.id, m]));
  const sharesByProperty = groupBy(ownershipShares, (share) => share.propertyId);

  const distributions: PropertyDistributionResult[] = [];
  const warnings: DistributionWarning[] = [];

  for (const summary of monthlySummaries) {
    const shares = sharesByProperty[summary.propertyId] || [];
    const validShares: OwnershipShare[] = [];

    for (const share of shares) {
      if (memberMap.has(share.memberId)) {
        validShares.push(share);
      } else {
        warnings.push({ propertyId: summary.propertyId, propertyName: summary.propertyName, issue: "MISSING_MEMBER", message: `Member ${share.memberId} not found` });
      }
    }

    const totalSharePercentage = validShares.reduce((sum, share) => sum + share.sharePercentage, 0);
    if (validShares.length > 0 && Math.abs(totalSharePercentage - 1) > 0.01) {
      warnings.push({ propertyId: summary.propertyId, propertyName: summary.propertyName, issue: "INVALID_SHARE_TOTAL", message: `Shares sum to ${Math.round(totalSharePercentage * 100)}%` });
    }

    const propertyDistributions = validShares.map((share) => {
      const member = memberMap.get(share.memberId)!;
      const distributionAmount = round2(summary.netIncome * share.sharePercentage);
      return { memberId: share.memberId, memberName: member.name, sharePercentage: share.sharePercentage, distributionAmount };
    });

    distributions.push({
      propertyId: summary.propertyId,
      propertyName: summary.propertyName,
      totalIncome: summary.totalIncome,
      totalExpenses: summary.totalExpenses,
      netIncome: summary.netIncome,
      distributions: propertyDistributions,
    });
  }

  return { distributions, warnings };
};

/**
 * Calculate overall family earnings summary by aggregating all member distributions.
 * Computes running balances using:
 *   - allHistoricalDistributions: ALL property distributions from ALL months (for rollover)
 *   - selectedMonthDistributions: distributions filtered to just the selected month
 *   - allPayouts: every member_payout record (filtered internally by month)
 *   - selectedMonthKey: the month we are viewing (format: YYYY-MM)
 */
export const calculateFamilyEarningsSummary = (
  distributions: PropertyDistributionResult[],
  options?: {
    allHistoricalDistributions?: PropertyDistributionResult[];
    selectedMonthDistributions?: PropertyDistributionResult[];
    allPayouts?: { memberId: string; amount: number; monthKey: string }[];
    selectedMonthKey?: string;
  }
): FamilyEarningsSummary => {
  const {
    allHistoricalDistributions,
    selectedMonthDistributions,
    allPayouts = [],
    selectedMonthKey,
  } = options ?? {};

  const usingRunningBalances =
    allHistoricalDistributions != null &&
    selectedMonthDistributions != null &&
    selectedMonthKey != null;

  // ── Helper: build member earning map from a set of distributions ──────────
  const buildMemberEarnings = (
    dists: PropertyDistributionResult[]
  ): Map<string, { name: string; total: number; properties: Map<string, { name: string; amount: number }> }> => {
    const map = new Map<string, { name: string; total: number; properties: Map<string, { name: string; amount: number }> }>();
    for (const dist of dists) {
      for (const md of dist.distributions) {
        if (!map.has(md.memberId)) {
          map.set(md.memberId, { name: md.memberName, total: 0, properties: new Map() });
        }
        const entry = map.get(md.memberId)!;
        entry.total = round2(entry.total + md.distributionAmount);
        const existing = entry.properties.get(dist.propertyId);
        if (existing) {
          existing.amount = round2(existing.amount + md.distributionAmount);
        } else {
          entry.properties.set(dist.propertyId, { name: dist.propertyName, amount: md.distributionAmount });
        }
      }
    }
    return map;
  };

  const memberMap = new Map<string, MemberDistribution>();

  if (usingRunningBalances) {
    // All earnings up-to-but-NOT-including the selected month
    const historicalBeforeMonth = (allHistoricalDistributions as PropertyDistributionResult[]).filter(
      () => true // we filter per distribution below
    );

    // Rebuild: earnings before selected month
    const earningsBeforeMap = buildMemberEarnings(
      (allHistoricalDistributions as PropertyDistributionResult[])
        .map((dist) => ({
          ...dist,
          distributions: dist.distributions, // all months already filtered externally
        }))
    );

    // All payouts before the selected month
    const payoutsBefore = new Map<string, number>();
    for (const p of allPayouts) {
      if (p.monthKey < selectedMonthKey!) {
        payoutsBefore.set(p.memberId, (payoutsBefore.get(p.memberId) ?? 0) + p.amount);
      }
    }

    // This month payouts
    const payoutsThisMonth = new Map<string, number>();
    for (const p of allPayouts) {
      if (p.monthKey === selectedMonthKey) {
        payoutsThisMonth.set(p.memberId, (payoutsThisMonth.get(p.memberId) ?? 0) + p.amount);
      }
    }

    // This month earnings
    const earningsThisMonthMap = buildMemberEarnings(selectedMonthDistributions as PropertyDistributionResult[]);

    // Collect all unique member IDs across all data
    const allMemberIds = new Set<string>([
      ...earningsBeforeMap.keys(),
      ...earningsThisMonthMap.keys(),
      ...allPayouts.map((p) => p.memberId),
    ]);

    for (const memberId of allMemberIds) {
      const beforeEntry = earningsBeforeMap.get(memberId);
      const thisMonthEntry = earningsThisMonthMap.get(memberId);
      const memberName = beforeEntry?.name ?? thisMonthEntry?.name ?? memberId;

      const totalEarnedBefore = beforeEntry?.total ?? 0;
      const totalPaidBefore = payoutsBefore.get(memberId) ?? 0;
      const previousRolloverBalance = round2(totalEarnedBefore - totalPaidBefore);

      const thisMonthEarnings = thisMonthEntry?.total ?? 0;
      const thisMonthPayouts = payoutsThisMonth.get(memberId) ?? 0;
      const currentNetBalance = round2(previousRolloverBalance + thisMonthEarnings - thisMonthPayouts);

      const properties = Array.from(thisMonthEntry?.properties.entries() ?? []).map(([propertyId, info]) => ({
        propertyId,
        propertyName: info.name,
        shareAmount: info.amount,
      }));

      memberMap.set(memberId, {
        memberId,
        memberName,
        totalShare: round2(thisMonthEarnings),
        previousRolloverBalance,
        thisMonthEarnings,
        thisMonthPayouts,
        currentNetBalance,
        properties,
      });
    }
  } else {
    // Legacy path (no running balance context supplied)
    for (const dist of distributions) {
      for (const memberDist of dist.distributions) {
        if (!memberMap.has(memberDist.memberId)) {
          memberMap.set(memberDist.memberId, {
            memberId: memberDist.memberId,
            memberName: memberDist.memberName,
            totalShare: 0,
            previousRolloverBalance: 0,
            thisMonthEarnings: 0,
            thisMonthPayouts: 0,
            currentNetBalance: 0,
            properties: [],
          });
        }
        const memberSummary = memberMap.get(memberDist.memberId)!;
        memberSummary.totalShare = round2(memberSummary.totalShare + memberDist.distributionAmount);
        memberSummary.thisMonthEarnings = memberSummary.totalShare;
        memberSummary.currentNetBalance = memberSummary.totalShare;

        const existingProperty = memberSummary.properties.find((p) => p.propertyId === dist.propertyId);
        if (existingProperty) {
          existingProperty.shareAmount = round2(existingProperty.shareAmount + memberDist.distributionAmount);
        } else {
          memberSummary.properties.push({
            propertyId: dist.propertyId,
            propertyName: dist.propertyName,
            shareAmount: memberDist.distributionAmount,
          });
        }
      }
    }
  }

  const memberSummaries = Array.from(memberMap.values());

  const totalFamilyIncome = distributions.reduce((sum, dist) => sum + dist.totalIncome, 0);
  const totalFamilyExpenses = distributions.reduce((sum, dist) => sum + dist.totalExpenses, 0);
  const netFamilyIncome = round2(totalFamilyIncome - totalFamilyExpenses);

  return {
    totalFamilyIncome,
    totalFamilyExpenses,
    netFamilyIncome,
    memberSummaries,
  };
};

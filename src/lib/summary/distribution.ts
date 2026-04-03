import { getAllProperties } from "@/lib/db/properties";
import { getAllFamilyMembers } from "@/lib/db/familyMembers";
import { getAllOwnershipShares } from "@/lib/db/ownershipShares";
import { getPropertySummaries } from "./properties";
import type {
  PropertyDistribution,
  MemberShare,
  FamilyMemberSummary,
  DashboardSummary,
} from "./types";

/**
 * Calculate property distribution to family members
 * Returns how property net income is distributed based on ownership percentages
 */
export const getPropertyDistributions = async (): Promise<
  PropertyDistribution[]
> => {
  try {
    const [properties, ownershipShares, familyMembers] = await Promise.all([
      getAllProperties(),
      getAllOwnershipShares(),
      getAllFamilyMembers(),
    ]);

    const propertySummaries = await getPropertySummaries(properties);

    // Create a map of memberId -> memberName
    const memberMap = new Map(
      familyMembers.map((m) => [m.id, m.name])
    );

    // Create a map of propertyId -> ownership shares
    const sharesMap = new Map<string, typeof ownershipShares>();
    ownershipShares.forEach((share) => {
      if (!sharesMap.has(share.propertyId)) {
        sharesMap.set(share.propertyId, []);
      }
      sharesMap.get(share.propertyId)!.push(share);
    });

    // Build distributions
    const distributions: PropertyDistribution[] = propertySummaries.map(
      (summary) => {
        const shares = sharesMap.get(summary.property.id) || [];

        const memberShares: MemberShare[] = shares.map((share) => ({
          memberId: share.memberId,
          memberName: memberMap.get(share.memberId) || "Unknown",
          percentage: share.percentage,
          shareAmount: (summary.netIncome * share.percentage) / 100,
        }));

        const totalDistributed = memberShares.reduce(
          (sum, member) => sum + member.shareAmount,
          0
        );

        return {
          property: summary.property,
          netIncome: summary.netIncome,
          members: memberShares,
          totalDistributed,
        };
      }
    );

    return distributions;
  } catch (error) {
    console.error("Error calculating property distributions:", error);
    return [];
  }
};

/**
 * Calculate overall family member summary across all properties
 * Returns total share income and per-property breakdown for each family member
 */
export const getFamilyMemberSummaries = async (): Promise<
  FamilyMemberSummary[]
> => {
  try {
    const [familyMembers, distributions] = await Promise.all([
      getAllFamilyMembers(),
      getPropertyDistributions(),
    ]);

    const memberSummaryMap = new Map<string, FamilyMemberSummary>();

    // Initialize summaries for all members
    familyMembers.forEach((member) => {
      memberSummaryMap.set(member.id, {
        member,
        totalShareIncome: 0,
        propertiesParticipated: [],
        propertyBreakdown: [],
      });
    });

    // Build summaries from distributions
    distributions.forEach((distribution) => {
      distribution.members.forEach((memberShare) => {
        const summary = memberSummaryMap.get(memberShare.memberId);
        if (summary) {
          summary.totalShareIncome += memberShare.shareAmount;

          // Add to property breakdown
          summary.propertyBreakdown.push({
            propertyId: distribution.property.id,
            propertyName: distribution.property.name,
            percentage: memberShare.percentage,
            shareAmount: memberShare.shareAmount,
          });

          // Track unique properties
          if (
            !summary.propertiesParticipated.find(
              (p) => p.id === distribution.property.id
            )
          ) {
            summary.propertiesParticipated.push(distribution.property);
          }
        }
      });
    });

    return Array.from(memberSummaryMap.values())
      .filter((s) => s.member.isActive)
      .sort((a, b) => b.totalShareIncome - a.totalShareIncome);
  } catch (error) {
    console.error("Error calculating family member summaries:", error);
    return [];
  }
};

/**
 * Calculate complete dashboard summary
 * Aggregates all summaries and distributions
 */
export const getDashboardSummary = async (): Promise<DashboardSummary> => {
  try {
    const [properties, familyMembers, distributions, memberSummaries] =
      await Promise.all([
        getAllProperties(),
        getAllFamilyMembers(),
        getPropertyDistributions(),
        getFamilyMemberSummaries(),
      ]);

    const activeProperties = properties.filter((p) => p.isActive);
    const activeMembers = familyMembers.filter((m) => m.isActive);

    const totalNetIncome = distributions.reduce(
      (sum, dist) => sum + dist.netIncome,
      0
    );
    const totalDistributedAmount = distributions.reduce(
      (sum, dist) => sum + dist.totalDistributed,
      0
    );

    return {
      totalNetIncome,
      totalDistributedAmount,
      activePropertiesCount: activeProperties.length,
      activeFamilyMembersCount: activeMembers.length,
      propertyDistributions: distributions,
      familyMemberSummaries: memberSummaries,
    };
  } catch (error) {
    console.error("Error calculating dashboard summary:", error);
    return {
      totalNetIncome: 0,
      totalDistributedAmount: 0,
      activePropertiesCount: 0,
      activeFamilyMembersCount: 0,
      propertyDistributions: [],
      familyMemberSummaries: [],
    };
  }
};

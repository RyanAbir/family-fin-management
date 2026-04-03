import { FamilyMember, OwnershipShare } from "@/types";

/**
 * Rounds a number to 2 decimal places.
 */
export const round2 = (num: number) => {
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

/**
 * Calculates Shariah-compliant percentages for a set of property shares.
 * Rule: Son = 2.0x, Daughter/Mother/Other = 1.0x
 */
export const calculateShariahPercentages = (
  propertyShares: OwnershipShare[],
  allMembers: FamilyMember[]
): { id: string; percentage: number }[] => {
  
  // 1. Calculate weights
  const sharesWithWeights = propertyShares.map((s) => {
    const member = allMembers.find((m) => m.id === s.memberId);
    
    // Son = 2, Daughter/Mother/Other = 1
    let weight = 1;
    if (member?.relation === "son") {
      weight = 2;
    }
    
    return { id: s.id, weight };
  });

  const totalWeights = sharesWithWeights.reduce((sum, s) => sum + s.weight, 0);

  if (totalWeights === 0) return [];

  // 2. Redistribute
  return sharesWithWeights.map((s) => ({
    id: s.id,
    percentage: round2((s.weight / totalWeights) * 100),
  }));
};

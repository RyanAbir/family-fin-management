import { describe, it, expect } from 'vitest';
import { calculatePropertyDistributions, calculateFamilyEarningsSummary } from '../distributions';
import type { PropertyFinancialSummary, OwnershipShare, FamilyMember } from '../types';

describe('distributions', () => {
  const mockSummaries: PropertyFinancialSummary[] = [
    {
      propertyId: 'prop1',
      propertyName: 'Property 1',
      totalIncome: 1500,
      totalExpenses: 200,
      netIncome: 1300,
      ownershipShares: [],
    },
    {
      propertyId: 'prop2',
      propertyName: 'Property 2',
      totalIncome: 800,
      totalExpenses: 150,
      netIncome: 650,
      ownershipShares: [],
    },
  ];

  const mockShares: OwnershipShare[] = [
    {
      id: 'share1',
      propertyId: 'prop1',
      memberId: 'member1',
      sharePercentage: 0.6,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'share2',
      propertyId: 'prop1',
      memberId: 'member2',
      sharePercentage: 0.4,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'share3',
      propertyId: 'prop2',
      memberId: 'member1',
      sharePercentage: 0.5,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'share4',
      propertyId: 'prop2',
      memberId: 'member2',
      sharePercentage: 0.5,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockMembers: FamilyMember[] = [
    { id: 'member1', name: 'John Doe', email: 'john@example.com', createdAt: new Date(), updatedAt: new Date() },
    { id: 'member2', name: 'Jane Smith', email: 'jane@example.com', createdAt: new Date(), updatedAt: new Date() },
  ];

  describe('calculatePropertyDistributions', () => {
    it('should calculate distributions by ownership percentage', () => {
      const result = calculatePropertyDistributions(mockSummaries, mockShares, mockMembers);

      expect(result.distributions).toHaveLength(2);

      const prop1Dist = result.distributions.find(d => d.propertyId === 'prop1');
      expect(prop1Dist?.distributions).toHaveLength(2);
      expect(prop1Dist?.distributions[0].distributionAmount).toBe(780); // 1300 * 0.6
      expect(prop1Dist?.distributions[1].distributionAmount).toBe(520); // 1300 * 0.4
    });

    it('should handle zero net income', () => {
      const zeroSummaries: PropertyFinancialSummary[] = [
        { ...mockSummaries[0], netIncome: 0 },
      ];
      const result = calculatePropertyDistributions(zeroSummaries, mockShares, mockMembers);

      const prop1Dist = result.distributions.find(d => d.propertyId === 'prop1');
      expect(prop1Dist?.distributions.every(d => d.distributionAmount === 0)).toBe(true);
    });

    it('should handle negative net income', () => {
      const negativeSummaries: PropertyFinancialSummary[] = [
        { ...mockSummaries[0], netIncome: -500 },
      ];
      const result = calculatePropertyDistributions(negativeSummaries, mockShares, mockMembers);

      const prop1Dist = result.distributions.find(d => d.propertyId === 'prop1');
      expect(prop1Dist?.distributions[0].distributionAmount).toBe(-300); // -500 * 0.6
    });

    it('should warn for invalid share totals', () => {
      const invalidShares = [
        { ...mockShares[0], sharePercentage: 0.7 },
        { ...mockShares[1], sharePercentage: 0.5 }, // Total 1.2
      ];
      const result = calculatePropertyDistributions(mockSummaries, invalidShares, mockMembers);

      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].code).toBe('INVALID_SHARE_TOTAL');
      expect(result.warnings[0].message).toContain('120%');
    });

    it('should warn for missing family members', () => {
      const sharesWithMissing = [
        ...mockShares,
        {
          id: 'share5',
          propertyId: 'prop1',
          memberId: 'missing',
          sharePercentage: 0.1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      const result = calculatePropertyDistributions(mockSummaries, sharesWithMissing, mockMembers);

      expect(result.warnings.some(w => w.code === 'MISSING_MEMBER')).toBe(true);
    });

    it('should return empty distributions for properties with no shares', () => {
      const noShares: OwnershipShare[] = [];
      const result = calculatePropertyDistributions(mockSummaries, noShares, mockMembers);

      expect(result.distributions.every(d => d.distributions.length === 0)).toBe(true);
    });
  });

  describe('calculateFamilyEarningsSummary', () => {
    it('should aggregate member distributions across properties', () => {
      const { distributions } = calculatePropertyDistributions(mockSummaries, mockShares, mockMembers);
      const result = calculateFamilyEarningsSummary(distributions);

      expect(result.memberSummaries).toHaveLength(2);

      const john = result.memberSummaries.find(m => m.memberId === 'member1');
      expect(john?.totalShare).toBe(1105); // 780 + 325 (650 * 0.5)

      const jane = result.memberSummaries.find(m => m.memberId === 'member2');
      expect(jane?.totalShare).toBe(845); // 520 + 325
    });

    it('should calculate total family income and expenses', () => {
      const { distributions } = calculatePropertyDistributions(mockSummaries, mockShares, mockMembers);
      const result = calculateFamilyEarningsSummary(distributions);

      expect(result.totalFamilyIncome).toBe(2300); // 1500 + 800
      expect(result.totalFamilyExpenses).toBe(350); // 200 + 150
      expect(result.netFamilyIncome).toBe(1950); // 2300 - 350
    });
  });
});
import { describe, it, expect } from 'vitest';
import { calculatePropertySummaries, calculateMonthlySummaries } from '../summaries';
import type { Property, IncomeEntry, ExpenseEntry } from '../types';

describe('summaries', () => {
  const mockProperties: Property[] = [
    { id: 'prop1', name: 'Property 1', address: '123 Main St', createdAt: new Date(), updatedAt: new Date() },
    { id: 'prop2', name: 'Property 2', address: '456 Oak St', createdAt: new Date(), updatedAt: new Date() },
  ];

  const mockIncomes: IncomeEntry[] = [
    { id: 'inc1', propertyId: 'prop1', amount: 1000, date: new Date('2026-04-01'), description: 'Rent', createdAt: new Date(), updatedAt: new Date() },
    { id: 'inc2', propertyId: 'prop1', amount: 500, date: new Date('2026-04-15'), description: 'Bonus', createdAt: new Date(), updatedAt: new Date() },
    { id: 'inc3', propertyId: 'prop2', amount: 800, date: new Date('2026-04-01'), description: 'Rent', createdAt: new Date(), updatedAt: new Date() },
  ];

  const mockExpenses: ExpenseEntry[] = [
    { id: 'exp1', propertyId: 'prop1', amount: 200, date: new Date('2026-04-01'), description: 'Maintenance', createdAt: new Date(), updatedAt: new Date() },
    { id: 'exp2', propertyId: 'prop2', amount: 150, date: new Date('2026-04-01'), description: 'Utilities', createdAt: new Date(), updatedAt: new Date() },
  ];

  describe('calculatePropertySummaries', () => {
    it('should calculate correct totals for each property', () => {
      const result = calculatePropertySummaries(mockProperties, mockIncomes, mockExpenses);

      expect(result).toHaveLength(2);

      const prop1 = result.find(r => r.propertyId === 'prop1');
      expect(prop1?.totalIncome).toBe(1500);
      expect(prop1?.totalExpenses).toBe(200);
      expect(prop1?.netIncome).toBe(1300);

      const prop2 = result.find(r => r.propertyId === 'prop2');
      expect(prop2?.totalIncome).toBe(800);
      expect(prop2?.totalExpenses).toBe(150);
      expect(prop2?.netIncome).toBe(650);
    });

    it('should include properties with zero entries', () => {
      const emptyProperties: Property[] = [
        { id: 'empty', name: 'Empty Property', address: '789 Pine St', createdAt: new Date(), updatedAt: new Date() },
      ];
      const result = calculatePropertySummaries(emptyProperties, [], []);

      expect(result).toHaveLength(1);
      expect(result[0].totalIncome).toBe(0);
      expect(result[0].totalExpenses).toBe(0);
      expect(result[0].netIncome).toBe(0);
    });

    it('should handle negative net income', () => {
      const highExpense: ExpenseEntry[] = [
        { id: 'exp1', propertyId: 'prop1', amount: 2000, date: new Date(), description: 'High expense', createdAt: new Date(), updatedAt: new Date() },
      ];
      const result = calculatePropertySummaries(mockProperties, mockIncomes, highExpense);

      const prop1 = result.find(r => r.propertyId === 'prop1');
      expect(prop1?.netIncome).toBe(-500);
    });
  });

  describe('calculateMonthlySummaries', () => {
    it('should group by property and month', () => {
      const result = calculateMonthlySummaries(mockProperties, mockIncomes, mockExpenses);

      expect(result).toHaveLength(2); // Two property-month combinations

      const prop1April = result.find(r => r.propertyId === 'prop1' && r.monthKey === '2026-04');
      expect(prop1April?.totalIncome).toBe(1500);
      expect(prop1April?.totalExpenses).toBe(200);
      expect(prop1April?.netIncome).toBe(1300);
    });

    it('should sort by monthKey descending then propertyName ascending', () => {
      const marchIncome: IncomeEntry[] = [
        { id: 'inc4', propertyId: 'prop1', amount: 300, date: new Date('2026-03-01'), description: 'March rent', createdAt: new Date(), updatedAt: new Date() },
      ];
      const result = calculateMonthlySummaries(mockProperties, [...mockIncomes, ...marchIncome], mockExpenses);

      expect(result).toHaveLength(3);
      expect(result[0].monthKey).toBe('2026-04'); // April first (descending)
      expect(result[1].monthKey).toBe('2026-04');
      expect(result[2].monthKey).toBe('2026-03'); // March last
    });
  });
});
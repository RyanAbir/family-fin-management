import { describe, it, expect } from 'vitest';
import { toSafeNumber, round2, getMonthKey, groupBy, sumBy } from '../helpers';

describe('helpers', () => {
  describe('toSafeNumber', () => {
    it('should return number for valid numbers', () => {
      expect(toSafeNumber(42)).toBe(42);
      expect(toSafeNumber(3.14)).toBe(3.14);
      expect(toSafeNumber('42')).toBe(42);
    });

    it('should return 0 for invalid values', () => {
      expect(toSafeNumber(null)).toBe(0);
      expect(toSafeNumber(undefined)).toBe(0);
      expect(toSafeNumber('invalid')).toBe(0);
      expect(toSafeNumber(NaN)).toBe(0);
    });
  });

  describe('round2', () => {
    it('should round to 2 decimal places', () => {
      expect(round2(3.14159)).toBe(3.14);
      expect(round2(2.5)).toBe(2.5);
      expect(round2(1.005)).toBe(1.01);
    });
  });

  describe('getMonthKey', () => {
    it('should format date to YYYY-MM', () => {
      expect(getMonthKey(new Date('2026-04-03'))).toBe('2026-04');
      expect(getMonthKey('2026-04-03')).toBe('2026-04');
    });

    it('should handle invalid dates', () => {
      expect(getMonthKey('invalid')).toBe('Invalid Date');
    });
  });

  describe('groupBy', () => {
    it('should group items by key', () => {
      const items = [
        { id: 1, category: 'A' },
        { id: 2, category: 'B' },
        { id: 3, category: 'A' },
      ];
      const result = groupBy(items, item => item.category);
      expect(result).toEqual({
        A: [items[0], items[2]],
        B: [items[1]],
      });
    });
  });

  describe('sumBy', () => {
    it('should sum values from selector', () => {
      const items = [{ value: 10 }, { value: 20 }, { value: 30 }];
      expect(sumBy(items, item => item.value)).toBe(60);
    });

    it('should handle invalid values safely', () => {
      const items = [{ value: 10 }, { value: null }, { value: 30 }];
      expect(sumBy(items, item => item.value)).toBe(40);
    });
  });
});
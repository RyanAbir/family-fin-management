/**
 * Financial calculation helpers and utilities
 */

/**
 * Calculate net income
 */
export const calculateNetIncome = (income: number, expense: number): number => {
  return income - expense;
};

/**
 * Calculate variance from expected amount
 */
export const calculateVariance = (expected: number, actual: number): number => {
  return expected - actual;
};

/**
 * Calculate member share of total income
 */
export const calculateMemberShare = (total: number, percentage: number): number => {
  return (total * percentage) / 100;
};

/**
 * Validate percentage is between 0 and 100
 */
export const isValidPercentage = (percentage: number): boolean => {
  return percentage >= 0 && percentage <= 100;
};

/**
 * Validate ownership shares sum correctly
 * Returns true if shares sum to 100 (or allowPartial is true)
 */
export const validateOwnershipShares = (
  percentages: number[],
  allowPartial: boolean = false
): boolean => {
  const sum = percentages.reduce((a, b) => a + b, 0);
  if (allowPartial) {
    return sum <= 100;
  }
  return Math.abs(sum - 100) < 0.01; // Account for floating point precision
};

/**
 * Format currency for display
 */
export const formatCurrency = (amount: number): string => {
  return amount.toLocaleString(undefined, {
    currency: "BDT",
  });
};

/**
 * Parse month key (YYYY-MM) to readable format
 */
export const formatMonthKey = (monthKey: string): string => {
  const [year, month] = monthKey.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleDateString(undefined, { year: "numeric", month: "long" });
};

/**
 * Generate month key from date
 */
export const generateMonthKey = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

/**
 * Get current month key
 */
export const getCurrentMonthKey = (): string => {
  return generateMonthKey(new Date());
};

/**
 * Calculate percentage of total
 */
export const getPercentageOfTotal = (part: number, total: number): number => {
  if (total === 0) return 0;
  return (part / total) * 100;
};

/**
 * Round to 2 decimal places
 */
export const roundToTwo = (num: number): number => {
  return Math.round(num * 100) / 100;
};

/**
 * Convert unknown values to safe numbers
 */
export const toSafeNumber = (value: unknown): number => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

/**
 * Round to 2 decimals (alternative implementation)
 */
export const round2 = (value: number): number =>
  Math.round((value + Number.EPSILON) * 100) / 100;

/**
 * Build a month key from a date string or Date object in YYYY-MM format
 */
export const getMonthKey = (value: string | Date): string => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid Date";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

/**
 * Group array items by key
 */
export const groupBy = <T, K extends string | number | symbol>(
  items: T[],
  keySelector: (item: T) => K
): Record<K, T[]> => {
  return items.reduce((groups, item) => {
    const key = keySelector(item);
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
    return groups;
  }, {} as Record<K, T[]>);
};

/**
 * Sum numeric arrays safely
 */
export const sumBy = <T>(items: T[], selector: (item: T) => number): number =>
  round2(items.reduce((sum, item) => sum + toSafeNumber(selector(item)), 0));

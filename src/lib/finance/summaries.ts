import type {
  Property,
  IncomeEntry,
  ExpenseEntry,
  PropertyFinancialSummary,
  PropertyMonthlySummary,
} from "./types";
import { toSafeNumber, round2, getMonthKey, groupBy, sumBy } from "./helpers";

/**
 * Calculate financial summaries for all properties
 */
export const calculatePropertySummaries = (
  properties: Property[],
  incomes: IncomeEntry[],
  expenses: ExpenseEntry[]
): PropertyFinancialSummary[] => {
  // Group incomes and expenses by propertyId
  const incomesByProperty = groupBy(incomes, (income) => income.propertyId);
  const expensesByProperty = groupBy(expenses, (expense) => expense.propertyId);

  return properties.map((property) => {
    const propertyIncomes = incomesByProperty[property.id] || [];
    const propertyExpenses = expensesByProperty[property.id] || [];

    const totalIncome = sumBy(propertyIncomes, (income) => income.amount);
    const totalExpenses = sumBy(propertyExpenses, (expense) => expense.amount);
    const netIncome = round2(totalIncome - totalExpenses);

    return {
      propertyId: property.id,
      propertyName: property.name,
      totalIncome,
      totalExpenses,
      netIncome,
      ownershipShares: [], // Not provided in inputs, so empty array
    };
  });
};

/**
 * Calculate monthly summaries for all properties
 */
export const calculateMonthlySummaries = (
  properties: Property[],
  incomes: IncomeEntry[],
  expenses: ExpenseEntry[]
): PropertyMonthlySummary[] => {
  // Create a map of properties for quick lookup
  const propertyMap = new Map(properties.map((p) => [p.id, p]));

  // Group incomes and expenses by propertyId and monthKey
  const allEntries: Array<{ propertyId: string; monthKey: string; amount: number; type: "income" | "expense" }> = [
    ...incomes.map((income) => ({
      propertyId: income.propertyId,
      monthKey: getMonthKey(income.date),
      amount: income.amount,
      type: "income" as const,
    })),
    ...expenses.map((expense) => ({
      propertyId: expense.propertyId,
      monthKey: getMonthKey(expense.date),
      amount: expense.amount,
      type: "expense" as const,
    })),
  ];

  const groupedByPropertyAndMonth = groupBy(
    allEntries,
    (entry) => `${entry.propertyId}-${entry.monthKey}`
  );

  // Generate summaries for each property-month combination
  const summaries: PropertyMonthlySummary[] = [];

  // Ensure all properties are included, even with zero entries
  for (const property of properties) {
    const propertyIncomes = incomes.filter((i) => i.propertyId === property.id);
    const propertyExpenses = expenses.filter((e) => e.propertyId === property.id);

    // Get unique month keys for this property
    const monthKeys = new Set([
      ...propertyIncomes.map((i) => getMonthKey(i.date)),
      ...propertyExpenses.map((e) => getMonthKey(e.date)),
    ]);

    // If no entries, include current month or something? Wait, the requirement is "include properties even when they have zero entries"
    // But for monthly, probably only include months that have entries, but since it says "include properties even when they have zero entries", perhaps for each property, if no entries, include with 0s for some month? But which month?
    // The requirement: "include properties even when they have zero entries" - probably means in the overall summaries, but for monthly, it's per month.
    // I think for monthly summaries, we only include months that have data, but ensure properties are represented if they have data.

    for (const monthKey of monthKeys) {
      const monthIncomes = propertyIncomes.filter((i) => getMonthKey(i.date) === monthKey);
      const monthExpenses = propertyExpenses.filter((e) => getMonthKey(e.date) === monthKey);

      const totalIncome = sumBy(monthIncomes, (income) => income.amount);
      const totalExpenses = sumBy(monthExpenses, (expense) => expense.amount);
      const netIncome = round2(totalIncome - totalExpenses);

      summaries.push({
        propertyId: property.id,
        propertyName: property.name,
        monthKey,
        totalIncome,
        totalExpenses,
        netIncome,
      });
    }
  }

  // Sort by monthKey descending, then propertyName ascending
  return summaries.sort((a, b) => {
    if (a.monthKey !== b.monthKey) {
      return b.monthKey.localeCompare(a.monthKey); // descending
    }
    return a.propertyName.localeCompare(b.propertyName); // ascending
  });
};

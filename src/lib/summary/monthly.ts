import { getAllIncomeEntries } from "@/lib/db/incomeEntries";
import { getAllExpenseEntries } from "@/lib/db/expenseEntries";
import { getAllProperties } from "@/lib/db/properties";
import type { MonthlySummary } from "./types";

/**
 * Calculate monthly summary for all properties
 * Returns summaries grouped by property and month
 */
export const getMonthlySummaries = async (): Promise<MonthlySummary[]> => {
  try {
    const [incomeEntries, expenseEntries, properties] = await Promise.all([
      getAllIncomeEntries(),
      getAllExpenseEntries(),
      getAllProperties(),
    ]);

    // Create a map of propertyId -> propertyName
    const propertyMap = new Map(properties.map((p) => [p.id, p.name]));

    // Group by propertyId and monthKey
    const summaryMap = new Map<string, MonthlySummary>();

    // Process income entries
    incomeEntries.forEach((entry) => {
      const key = `${entry.propertyId}|${entry.monthKey}`;
      if (!summaryMap.has(key)) {
        summaryMap.set(key, {
          propertyId: entry.propertyId,
          propertyName: propertyMap.get(entry.propertyId) || "Unknown",
          monthKey: entry.monthKey,
          totalIncome: 0,
          totalExpense: 0,
          netIncome: 0,
        });
      }
      const summary = summaryMap.get(key)!;
      summary.totalIncome += entry.amount;
      summary.netIncome = summary.totalIncome - summary.totalExpense;
    });

    // Process expense entries
    expenseEntries.forEach((entry) => {
      const key = `${entry.propertyId}|${entry.monthKey}`;
      if (!summaryMap.has(key)) {
        summaryMap.set(key, {
          propertyId: entry.propertyId,
          propertyName: propertyMap.get(entry.propertyId) || "Unknown",
          monthKey: entry.monthKey,
          totalIncome: 0,
          totalExpense: 0,
          netIncome: 0,
        });
      }
      const summary = summaryMap.get(key)!;
      summary.totalExpense += entry.amount;
      summary.netIncome = summary.totalIncome - summary.totalExpense;
    });

    return Array.from(summaryMap.values()).sort((a, b) => {
      // Sort by monthKey descending, then propertyName
      if (a.monthKey !== b.monthKey) {
        return b.monthKey.localeCompare(a.monthKey);
      }
      return a.propertyName.localeCompare(b.propertyName);
    });
  } catch (error) {
    console.error("Error calculating monthly summaries:", error);
    return [];
  }
};

/**
 * Get monthly summary for a specific property
 */
export const getPropertyMonthlySummaries = async (
  propertyId: string,
  propertyName: string
): Promise<MonthlySummary[]> => {
  const allSummaries = await getMonthlySummaries();
  return allSummaries.filter((s) => s.propertyId === propertyId);
};

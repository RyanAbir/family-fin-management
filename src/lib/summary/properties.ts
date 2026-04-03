import { getAllIncomeEntries } from "@/lib/db/incomeEntries";
import { getAllExpenseEntries } from "@/lib/db/expenseEntries";
import type { Property } from "@/types";
import type { PropertySummary } from "./types";

/**
 * Calculate income and expense summary for a single property
 */
export const getPropertySummary = async (
  property: Property
): Promise<PropertySummary> => {
  try {
    const [incomeEntries, expenseEntries] = await Promise.all([
      getAllIncomeEntries(),
      getAllExpenseEntries(),
    ]);

    // Filter entries for this property
    const propertyIncome = incomeEntries.filter(
      (entry) => entry.propertyId === property.id
    );
    const propertyExpense = expenseEntries.filter(
      (entry) => entry.propertyId === property.id
    );

    // Calculate totals
    const totalIncome = propertyIncome.reduce(
      (sum, entry) => sum + entry.amount,
      0
    );
    const totalExpense = propertyExpense.reduce(
      (sum, entry) => sum + entry.amount,
      0
    );
    const netIncome = totalIncome - totalExpense;

    // Calculate variance from expected rent
    let variance: number | undefined;
    if (property.expectedRent !== undefined && property.expectedRent > 0) {
      // Variance = expectedRent - actualNetIncome (positive means less income than expected)
      variance = property.expectedRent - netIncome;
    }

    return {
      property,
      totalIncome,
      totalExpense,
      netIncome,
      expectedRent: property.expectedRent,
      varianceFromExpectedRent: variance,
    };
  } catch (error) {
    console.error(`Error calculating summary for property ${property.id}:`, error);
    return {
      property,
      totalIncome: 0,
      totalExpense: 0,
      netIncome: 0,
      expectedRent: property.expectedRent,
    };
  }
};

/**
 * Calculate summaries for multiple properties
 */
export const getPropertySummaries = async (
  properties: Property[]
): Promise<PropertySummary[]> => {
  const summaries = await Promise.all(
    properties.map((property) => getPropertySummary(property))
  );
  return summaries;
};

/**
 * Get property summaries for active properties only
 */
export const getActivePropertySummaries = async (
  properties: Property[]
): Promise<PropertySummary[]> => {
  const activeProperties = properties.filter((p) => p.isActive);
  return getPropertySummaries(activeProperties);
};

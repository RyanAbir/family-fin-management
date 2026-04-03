import { getAllProperties } from "./properties";
import { getActiveFamilyMembers } from "./familyMembers";
import { syncSharesForProperty } from "./ownershipShares";

/**
 * Bulk synchronizes all properties and all active family members.
 * Creates missing ownership shares and rebalances everything using Shariah rule.
 */
export const syncAllFamilyShares = async (): Promise<{ success: boolean; propertyCount: number; error?: string }> => {
  try {
    const properties = await getAllProperties();
    const members = await getActiveFamilyMembers();

    if (properties.length === 0) return { success: true, propertyCount: 0 };

    // Process properties sequentially to avoid Firestore write limits or contention
    for (const prop of properties) {
      await syncSharesForProperty(prop.id, members);
    }

    return { success: true, propertyCount: properties.length };
  } catch (error: any) {
    console.error("Sync Error:", error);
    return { success: false, propertyCount: 0, error: error.message };
  }
};

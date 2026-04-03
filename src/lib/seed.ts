import {
  getAllProperties,
  createProperty
} from "./db/properties";
import {
  getAllFamilyMembers,
  createFamilyMember
} from "./db/familyMembers";
import {
  getAllOwnershipShares,
  createOwnershipShare
} from "./db/ownershipShares";
import {
  seedProperties,
  seedFamilyMembers,
  seedOwnershipShares
} from "./seedData";
import type { Property, FamilyMember } from "../types";

export interface SeedResult {
  success: boolean;
  message: string;
  data?: {
    propertiesCreated: number;
    membersCreated: number;
    sharesCreated: number;
  };
}

export const seedDatabase = async (): Promise<SeedResult> => {
  try {
    // Check if data already exists
    const existingProperties = await getAllProperties();
    const existingMembers = await getAllFamilyMembers();
    const existingShares = await getAllOwnershipShares();

    if (existingProperties.length > 0 || existingMembers.length > 0 || existingShares.length > 0) {
      return {
        success: false,
        message: "Database already contains data. Seeding prevented to avoid duplicates.",
      };
    }

    // Seed properties
    const createdProperties: Property[] = [];
    for (const propertyData of seedProperties) {
      const property = await createProperty(propertyData);
      createdProperties.push(property);
    }

    // Seed family members
    const createdMembers: FamilyMember[] = [];
    for (const memberData of seedFamilyMembers) {
      const member = await createFamilyMember(memberData);
      createdMembers.push(member);
    }

    // Seed ownership shares
    const ownershipShares = seedOwnershipShares(createdProperties, createdMembers);
    let sharesCreated = 0;
    for (const shareData of ownershipShares) {
      await createOwnershipShare(shareData);
      sharesCreated++;
    }

    return {
      success: true,
      message: "Database seeded successfully!",
      data: {
        propertiesCreated: createdProperties.length,
        membersCreated: createdMembers.length,
        sharesCreated,
      },
    };
  } catch (error) {
    console.error("Error seeding database:", error);
    return {
      success: false,
      message: `Seeding failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
};
import type { Property, FamilyMember, OwnershipShare } from "../types";

export const seedProperties: Omit<Property, 'id'>[] = [
  {
    code: "P001",
    name: "Shop (Star Kabab)",
    type: "Shop",
    location: "Mirpur 10",
    expectedRent: 15000,
    notes: "Popular kabab shop with good foot traffic",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    code: "P002",
    name: "Shop (Razor Salon)",
    type: "Shop",
    location: "Mirpur 10",
    expectedRent: 8000,
    notes: "Well-established salon business",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    code: "P003",
    name: "House",
    type: "Residential",
    location: "Mirpur 11",
    expectedRent: 25000,
    notes: "Family residential property",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    code: "P004",
    name: "Shop",
    type: "Shop",
    location: "Tejgaon Nakhalpara",
    expectedRent: 12000,
    notes: "Commercial shop in busy area",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const seedFamilyMembers: Omit<FamilyMember, 'id'>[] = [
  {
    name: "Ayesha Begum",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: "Akram Faruk",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: "Omar Faruk",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: "Hasina Akter",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: "Selina Akter",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: "Tahmeena Akter",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const seedOwnershipShares = (properties: Property[], members: FamilyMember[]): Omit<OwnershipShare, 'id'>[] => {
  const shares: Omit<OwnershipShare, 'id'>[] = [];

  // Standard ownership percentages
  const ownershipPercentages: Record<string, number> = {
    "Ayesha Begum": 12.5,
    "Akram Faruk": 25,
    "Omar Faruk": 25,
    "Hasina Akter": 12.5,
    "Selina Akter": 12.5,
    "Tahmeena Akter": 12.5,
  };

  // Create shares for each property and member
  properties.forEach(property => {
    members.forEach(member => {
      shares.push({
        propertyId: property.id,
        memberId: member.id,
        percentage: ownershipPercentages[member.name] || 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });
  });

  return shares;
};
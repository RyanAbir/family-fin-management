import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  Timestamp 
} from "firebase/firestore";
import { db } from "../firebase";

const PROPERTIES_COLLECTION = "properties";
const FAMILY_MEMBERS_COLLECTION = "familyMembers";
const INCOME_ENTRIES_COLLECTION = "incomeEntries";
const EXPENSE_ENTRIES_COLLECTION = "expenseEntries";
const OWNERSHIP_SHARES_COLLECTION = "ownershipShares";

export const seedDemoData = async () => {
  try {
    console.log("Starting debug seeding...");

    // 1. Seed properties
    const prop1 = await addDoc(collection(db, PROPERTIES_COLLECTION), {
      name: "Blue Water Villa",
      address: "123 Ocean Drive, Seaside",
      type: "Residential",
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const prop2 = await addDoc(collection(db, PROPERTIES_COLLECTION), {
      name: "Sky High Penthouse",
      address: "Level 45, Zenith Tower",
      type: "Commercial",
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const prop3 = await addDoc(collection(db, PROPERTIES_COLLECTION), {
      name: "Downtown Loft",
      address: "Main St, Urban Center",
      type: "Investment",
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // 2. Seed family members
    const mem1 = await addDoc(collection(db, FAMILY_MEMBERS_COLLECTION), {
      name: "Ryan Abir",
      email: "ryan@example.com",
      phone: "+8801700000001",
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const mem2 = await addDoc(collection(db, FAMILY_MEMBERS_COLLECTION), {
      name: "Abir Ahmed",
      email: "abir@example.com",
      phone: "+8801700000002",
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // 3. Seed Ownership Shares
    await addDoc(collection(db, OWNERSHIP_SHARES_COLLECTION), {
      propertyId: prop1.id,
      memberId: mem1.id,
      sharePercentage: 60,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await addDoc(collection(db, OWNERSHIP_SHARES_COLLECTION), {
      propertyId: prop1.id,
      memberId: mem2.id,
      sharePercentage: 40,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // 4. Seed Income
    await addDoc(collection(db, INCOME_ENTRIES_COLLECTION), {
      propertyId: prop1.id,
      memberId: mem1.id,
      amount: 50000,
      category: "Rent",
      description: "Monthly rent for Blue Water Villa",
      date: Timestamp.now(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await addDoc(collection(db, INCOME_ENTRIES_COLLECTION), {
      propertyId: prop2.id,
      memberId: mem2.id,
      amount: 120000,
      category: "Commercial Lease",
      description: "Quarterly lease payment",
      date: Timestamp.now(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // 5. Seed Expenses
    await addDoc(collection(db, EXPENSE_ENTRIES_COLLECTION), {
      propertyId: prop1.id,
      amount: 1200,
      category: "Maintenance",
      description: "Plumbing repair",
      date: Timestamp.now(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await addDoc(collection(db, EXPENSE_ENTRIES_COLLECTION), {
      propertyId: prop3.id,
      amount: 5000,
      category: "Tax",
      description: "Annual property tax",
      date: Timestamp.now(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    console.log("Seeding complete!");
    return { success: true };
  } catch (err: any) {
    console.error("Seeding failed:", err);
    throw err;
  }
};

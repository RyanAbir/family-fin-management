# Property Finance Dashboard - Business Logic

## Overview

This document describes the core business logic layer for the Property Finance Dashboard, located in `src/lib/summary/`.

The summary layer provides reusable, type-safe functions to calculate income distribution, expenses, and family member shares across properties.

## Architecture

### Summary Layer Structure

```
src/lib/summary/
├── types.ts          # TypeScript interfaces for all summary types
├── properties.ts     # Property-level calculations
├── monthly.ts        # Monthly summary aggregations
└── distribution.ts   # Family member distribution logic
```

### Data Flow

```
Raw Firestore Collections
  ├── properties
  ├── family_members
  ├── ownership_shares
  ├── income_entries
  └── expense_entries
         ↓
    Summary Functions
      ├── getPropertySummaries()
      ├── getMonthlySummaries()
      ├── getPropertyDistributions()
      ├── getFamilyMemberSummaries()
      └── getDashboardSummary()
         ↓
    UI Components (Pages)
      └── /distribution
```

## Core Functions

### 1. Property Summaries

**Location:** `lib/summary/properties.ts`

**Purpose:** Calculate income, expenses, and net income for each property across all time.

**Functions:**

```typescript
getPropertySummary(property: Property): Promise<PropertySummary>
```

- Calculates single property summary
- Aggregates all income/expense entries
- Computes net income = totalIncome - totalExpense
- Calculates variance from expected rent (if set)

**Return Type:**

```typescript
interface PropertySummary {
  property: Property;
  totalIncome: number;
  totalExpense: number;
  netIncome: number;
  expectedRent?: number;
  varianceFromExpectedRent?: number;
}
```

**Example:**

```typescript
const property = { id: "prop1", name: "Downtown Apt", expectedRent: 5000, ... };
const summary = await getPropertySummary(property);
// Returns:
// {
//   property: {...},
//   totalIncome: 5200,
//   totalExpense: 1200,
//   netIncome: 4000,
//   expectedRent: 5000,
//   varianceFromExpectedRent: 1000 (expected more than actual)
// }
```

### 2. Monthly Summaries

**Location:** `lib/summary/monthly.ts`

**Purpose:** Calculate income and expenses aggregated by property and month.

**Functions:**

```typescript
getMonthlySummaries(): Promise<MonthlySummary[]>
```

- Returns all monthly summaries across all properties
- Grouped by propertyId and monthKey (YYYY-MM format)
- Sorted by month descending, then property name

**Return Type:**

```typescript
interface MonthlySummary {
  propertyId: string;
  propertyName: string;
  monthKey: string;      // Format: YYYY-MM
  totalIncome: number;
  totalExpense: number;
  netIncome: number;
}
```

**Example:**

```typescript
const monthlySummaries = await getMonthlySummaries();
// Returns:
// [
//   {
//     propertyId: "prop1",
//     propertyName: "Downtown Apt",
//     monthKey: "2026-04",
//     totalIncome: 5200,
//     totalExpense: 1200,
//     netIncome: 4000
//   },
//   {
//     propertyId: "prop1",
//     propertyName: "Downtown Apt",
//     monthKey: "2026-03",
//     totalIncome: 5000,
//     totalExpense: 1100,
//     netIncome: 3900
//   },
//   ...
// ]
```

### 3. Property Distribution to Family Members

**Location:** `lib/summary/distribution.ts`

**Purpose:** Calculate how property net income is distributed to family members based on ownership percentages.

**Functions:**

```typescript
getPropertyDistributions(): Promise<PropertyDistribution[]>
```

- Reads ownership shares for each property
- Distributes property net income by percentage
- Combines all properties with their member allocations

**Return Type:**

```typescript
interface MemberShare {
  memberId: string;
  memberName: string;
  percentage: number;
  shareAmount: number;    // netIncome * (percentage / 100)
}

interface PropertyDistribution {
  property: Property;
  netIncome: number;
  members: MemberShare[];
  totalDistributed: number;  // Sum of all member shares
}
```

**Formula:**

```
memberShareAmount = propertyNetIncome * (memberPercentage / 100)
```

**Example:**

```typescript
const distributions = await getPropertyDistributions();
// Returns:
// [
//   {
//     property: { id: "prop1", name: "Downtown Apt", ... },
//     netIncome: 4000,
//     members: [
//       { memberId: "m1", memberName: "Alice", percentage: 60, shareAmount: 2400 },
//       { memberId: "m2", memberName: "Bob", percentage: 40, shareAmount: 1600 }
//     ],
//     totalDistributed: 4000
//   },
//   ...
// ]
```

### 4. Family Member Summaries

**Location:** `lib/summary/distribution.ts`

**Purpose:** Aggregate income distribution for each family member across all properties.

**Functions:**

```typescript
getFamilyMemberSummaries(): Promise<FamilyMemberSummary[]>
```

- Calculates total share income for each member
- Tracks properties they participate in
- Provides per-property breakdown
- Only includes active family members
- Sorted by total income descending

**Return Type:**

```typescript
interface FamilyMemberSummary {
  member: FamilyMember;
  totalShareIncome: number;
  propertiesParticipated: Property[];
  propertyBreakdown: {
    propertyId: string;
    propertyName: string;
    percentage: number;
    shareAmount: number;
  }[];
}
```

**Example:**

```typescript
const memberSummaries = await getFamilyMemberSummaries();
// Returns:
// [
//   {
//     member: { id: "m1", name: "Alice", isActive: true, ... },
//     totalShareIncome: 5000,  // Sum across all properties
//     propertiesParticipated: [
//       { id: "prop1", name: "Downtown Apt", ... },
//       { id: "prop2", name: "Beach House", ... }
//     ],
//     propertyBreakdown: [
//       { propertyId: "prop1", propertyName: "Downtown Apt", percentage: 60, shareAmount: 2400 },
//       { propertyId: "prop2", propertyName: "Beach House", percentage: 50, shareAmount: 2600 }
//     ]
//   },
//   ...
// ]
```

### 5. Complete Dashboard Summary

**Location:** `lib/summary/distribution.ts`

**Purpose:** All-in-one dashboard data aggregation.

**Functions:**

```typescript
getDashboardSummary(): Promise<DashboardSummary>
```

- Combines all calculations
- Includes summary statistics
- Ready to display on dashboard

**Return Type:**

```typescript
interface DashboardSummary {
  totalNetIncome: number;
  totalDistributedAmount: number;
  activePropertiesCount: number;
  activeFamilyMembersCount: number;
  propertyDistributions: PropertyDistribution[];
  familyMemberSummaries: FamilyMemberSummary[];
}
```

## Usage Examples

### Example 1: Display Property Summary

```typescript
import { getPropertySummaries } from "@/lib/summary/properties";
import { getAllProperties } from "@/lib/db/properties";

export default function PropertyPage() {
  const [summaries, setSummaries] = useState<PropertySummary[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const properties = await getAllProperties();
      const sums = await getPropertySummaries(properties);
      setSummaries(sums);
    };
    fetchData();
  }, []);

  return (
    <div>
      {summaries.map((summary) => (
        <div key={summary.property.id}>
          <h3>{summary.property.name}</h3>
          <p>Income: ${summary.totalIncome}</p>
          <p>Expenses: ${summary.totalExpense}</p>
          <p>Net: ${summary.netIncome}</p>
        </div>
      ))}
    </div>
  );
}
```

### Example 2: Display Distribution Dashboard

```typescript
import { getDashboardSummary } from "@/lib/summary/distribution";

export default function DistributionPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const data = await getDashboardSummary();
      setSummary(data);
    };
    fetchData();
  }, []);

  if (!summary) return <div>Loading...</div>;

  return (
    <div>
      <h2>Total Income: ${summary.totalNetIncome}</h2>
      <h2>Properties: {summary.activePropertiesCount}</h2>

      <h3>Property Distribution</h3>
      <table>
        <tbody>
          {summary.propertyDistributions.map((dist) => (
            <tr key={dist.property.id}>
              <td>{dist.property.name}</td>
              <td>${dist.netIncome}</td>
              <td>
                {dist.members.map((member) => (
                  <div key={member.memberId}>
                    {member.memberName}: ${member.shareAmount}
                  </div>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Family Members</h3>
      <table>
        <tbody>
          {summary.familyMemberSummaries.map((member) => (
            <tr key={member.member.id}>
              <td>{member.member.name}</td>
              <td>${member.totalShareIncome}</td>
              <td>{member.propertiesParticipated.length} properties</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

## Data Safety & Error Handling

All functions include built-in error handling:

1. **Missing Data:** Returns zeros or empty arrays
2. **No Income/Expense:** Property can have zero amounts
3. **No Shares:** Properties without family members still calculate net income
4. **Inactive Members:** Filtered out in family summaries
5. **Inactive Properties:** Can be filtered using `getActivePropertySummaries()`

## Performance Considerations

- Summary functions aggregate all Firestore data once
- Use memoization in React components to avoid recalculation
- Monthly summaries group all entries - consider caching for large datasets
- All calculations run on client side for real-time results

## Connection to UI

The `/distribution` page (`src/app/distribution/page.tsx`) is fully wired with:

- Summary cards showing key metrics
- Property distribution table with member allocations
- Family member summary cards with property breakdowns
- Filters by property and family member
- Loading, error, and empty states
- Responsive design for mobile/desktop

## Future Enhancements

1. Add monthly filtering in distribution view
2. Implement caching for large datasets
3. Add export to CSV functionality
4. Create variance analysis (actual vs expected)
5. Add historical trend charts
6. Implement approval workflows for distributions

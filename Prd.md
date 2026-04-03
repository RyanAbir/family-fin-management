# 📄 Product Requirements Document (PRD)

## Property Finance & Family Distribution App

---

# 1. 🧭 Product Overview

### Product Name:

**Property Finance Dashboard**

### Goal:

Build a web app to manage:

* Rental income
* Property expenses
* Automatic profit distribution among family members

---

# 2. 👥 Users

### Primary Users:

* Family members managing shared properties

### Roles:

* Admin (full control)
* Viewer (optional future)

---

# 3. 🧱 Core Modules

---

## 3.1 Properties Module ✅ DONE

Track all properties

### Fields:

* Property Name
* Type (Rent / Shop / Residential / Commercial) — dropdown
* Location

---

## 3.2 Family Members Module ✅ DONE

Store all members

### Fields:

* Name
* Active Status

---

## 3.3 Ownership Shares Module ✅ DONE

Defines distribution per property

### Fields:

* Property
* Member Name
* Share Percentage

### Logic:

* Total must = 100% (enforced with validation)
* No duplicate members per property

---

## 3.4 Income Module ✅ DONE

Track rent and other income

### Fields:

* Date (auto-filled with today, required)
* Month (auto-generated from date)
* Property
* Category (Rent / Advance Adjustment / Other Income)
* Description (required when category = Other Income)
* Amount (BDT)

### UX Enhancements:

* Last selected category remembered across sessions

---

## 3.5 Expense Module ✅ DONE

Track operational expenses

### Fields:

* Date (auto-filled with today, required)
* Month (auto-generated from date)
* Property
* Category (Maintenance / Utility / Tax / Staff / Other Expense)
* Description (required when category = Other Expense)
* Amount (BDT)

### UX Enhancements:

* Last selected category remembered across sessions

---

## 3.6 Member Payouts Module ✅ DONE

Track funds withdrawn by family members

### Fields:

* Family Member
* Date
* Month (auto-generated)
* Amount (BDT)
* Description / Memo (optional)

---

# 4. 📊 Calculations & Business Logic

---

## 4.1 Net Income per Property ✅ DONE

```
Net Income = Total Income - Total Expenses
```

---

## 4.2 Monthly Summary ✅ DONE

For each property per month:

* Total income
* Total expense
* Net income

---

## 4.3 Family Share Distribution ✅ DONE

For each property:

```
Member Share = Net Income × Ownership %
```

---

## 4.4 Overall Family Summary ✅ DONE

For each member with **running balances**:

* Previous Rollover Balance (earnings − payouts from all prior months)
* This Month's Earnings (property share for selected month)
* This Month's Withdrawals (recorded payouts)
* Current Net Balance = Previous Balance + Earnings − Withdrawals
* Balance can be **negative** (overdrawn) or **positive** (credit)

---

# 5. 📈 Dashboard Requirements

---

## Main Dashboard should show:

### KPIs: ⚠️ PARTIALLY DONE

| KPI | Status |
|---|---|
| Total Income | ✅ Done |
| Total Expenses | ✅ Done |
| Net Profit | ✅ Done |
| Total Properties | ❌ Missing |

---

### Charts: ⚠️ PARTIALLY DONE

| Chart | Status |
|---|---|
| Income vs Expenses Bar Chart (by month) | ✅ Done |
| Income by Property (Bar Chart) | ❌ Missing |
| Family Distribution (Pie Chart) | ❌ Missing |
| Monthly Income Trend (Line Chart) | ❌ Missing |

---

### Tables: ⚠️ PARTIALLY DONE

| Table | Status |
|---|---|
| Property Summary | ✅ Done |
| Recent Transactions | ✅ Done |
| Family Earnings Summary | ✅ Done |
| Monthly Summary Table | ❌ Missing |

---

# 6. 🧠 Key Features

---

### ✅ Core Features (Done):

* Add/Edit/Delete income entries
* Add/Edit/Delete expense entries
* Add/Edit/Delete member payouts
* Auto-calculation of net profit
* Auto-distribution to family members by ownership %
* Running balance per member (month-by-month)
* Month selector on Distribution page
* BDT currency throughout
* Category memory (localStorage)
* Auto date + monthKey generation
* "Other" category note enforcement

---

### 🔥 Advanced Features (Phase 2 — Backlog):

* Total Properties KPI card on Dashboard
* Family Distribution Pie Chart
* Monthly Income Trend Line Chart
* Income by Property Bar Chart
* Monthly Summary Table on Dashboard
* Rent due tracking (paid vs unpaid)
* Notifications / reminders
* Multi-user login (Admin / Viewer roles)
* Mobile app (APK / PWA)
* PDF report generation
* Tax reporting
* AI insights (profit trends)

---

# 7. 🗄️ Database Design

Firestore Collections:

| Collection | Status |
|---|---|
| `properties` | ✅ Active |
| `family_members` | ✅ Active |
| `ownership_shares` | ✅ Active |
| `income_entries` | ✅ Active |
| `expense_entries` | ✅ Active |
| `member_payouts` | ✅ Active |

---

# 8. 🎯 Success Criteria

* All financial data centralized ✅
* Manual Excel work eliminated ✅
* Real-time dashboard visibility ⚠️ (partial — charts pending)
* Accurate family distribution with running balances ✅

---

# 9. 🚀 Tech Stack

* **Frontend:** Next.js (App Router) + TypeScript
* **Styling:** Tailwind CSS v4
* **Database:** Firebase Firestore
* **Charts:** Recharts
* **Icons:** Lucide React
* **Hosting:** Vercel / Firebase

---

# 10. 📅 Completion Status

| Area | Completion |
|---|---|
| Core CRUD Modules | **100%** (6/6 active modules done) |
| Business Logic | **100%** |
| Dashboard KPIs | **75%** (3/4) |
| Dashboard Charts | **25%** (1/4) |
| Dashboard Tables | **75%** (3/4) |
| **Overall** | **~80%** |
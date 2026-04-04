"use client";

import { useEffect, useState, useMemo } from "react";
import { getAllProperties } from "@/lib/db/properties";
import { getAllFamilyMembers } from "@/lib/db/familyMembers";
import { getAllOwnershipShares } from "@/lib/db/ownershipShares";
import { getAllIncomeEntries } from "@/lib/db/incomeEntries";
import { getAllExpenseEntries } from "@/lib/db/expenseEntries";
import { getAllMemberPayouts } from "@/lib/db/memberPayouts";
import { calculatePropertySummaries } from "@/lib/finance/summaries";
import {
  calculatePropertyDistributions,
  calculateFamilyEarningsSummary,
  type PropertyDistributionResult,
} from "@/lib/finance/distributions";
import { FamilySummaryCards } from "@/components/distribution/FamilySummaryCards";
import { FamilySummaryTable } from "@/components/distribution/FamilySummaryTable";
import { PropertyDistributionTable } from "@/components/distribution/PropertyDistributionTable";
import type { Property, FamilyMember, OwnershipShare, IncomeEntry, ExpenseEntry, MemberPayout } from "@/types";
import { CalendarDays } from "lucide-react";

function toFinanceProperty(p: Property) {
  return { id: p.id, name: p.name, address: p.location, createdAt: p.createdAt, updatedAt: p.updatedAt };
}
function toFinanceMember(m: FamilyMember) {
  return { id: m.id, name: m.name, email: undefined, createdAt: m.createdAt, updatedAt: m.updatedAt };
}
function toFinanceShare(s: OwnershipShare) {
  return { id: s.id, propertyId: s.propertyId, memberId: s.memberId, sharePercentage: s.percentage / 100, createdAt: s.createdAt, updatedAt: s.updatedAt };
}
function toFinanceIncome(i: IncomeEntry) {
  return { id: i.id, propertyId: i.propertyId, amount: i.amount, date: i.date, description: i.description || '', createdAt: i.createdAt, updatedAt: i.updatedAt };
}
function toFinanceExpense(e: ExpenseEntry) {
  return { id: e.id, propertyId: e.propertyId, amount: e.amount, date: e.date, description: e.description || '', createdAt: e.createdAt, updatedAt: e.updatedAt };
}

export default function DistributionPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [ownershipShares, setOwnershipShares] = useState<OwnershipShare[]>([]);
  const [incomeEntries, setIncomeEntries] = useState<IncomeEntry[]>([]);
  const [expenseEntries, setExpenseEntries] = useState<ExpenseEntry[]>([]);
  const [payouts, setPayouts] = useState<MemberPayout[]>([]);
  const [loading, setLoading] = useState(true);

  const currentMonthKey = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }, []);

  const [selectedMonthKey, setSelectedMonthKey] = useState(currentMonthKey);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [dbProperties, dbMembers, dbShares, dbIncome, dbExpenses, dbPayouts] = await Promise.all([
          getAllProperties(),
          getAllFamilyMembers(),
          getAllOwnershipShares(),
          getAllIncomeEntries(),
          getAllExpenseEntries(),
          getAllMemberPayouts(),
        ]);
        setProperties(dbProperties);
        setFamilyMembers(dbMembers);
        setOwnershipShares(dbShares);
        setIncomeEntries(dbIncome);
        setExpenseEntries(dbExpenses);
        setPayouts(dbPayouts);
      } catch (err) {
        console.error("Distribution fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Derive all available months from income/expense entries
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    incomeEntries.forEach((e) => e.monthKey && months.add(e.monthKey));
    expenseEntries.forEach((e) => e.monthKey && months.add(e.monthKey));
    months.add(currentMonthKey);
    return Array.from(months).sort().reverse();
  }, [incomeEntries, expenseEntries, currentMonthKey]);

  // ── Finance engine computations ──────────────────────────────────────────
  const financeProps = useMemo(() => properties.map(toFinanceProperty), [properties]);
  const financeMembers = useMemo(() => familyMembers.map(toFinanceMember), [familyMembers]);
  const financeShares = useMemo(() => ownershipShares.map(toFinanceShare), [ownershipShares]);

  // ALL historical income/expenses (for rollover calculation: earnings before selected month)
  const historicalIncome = useMemo(
    () => incomeEntries.filter((e) => e.monthKey < selectedMonthKey).map(toFinanceIncome),
    [incomeEntries, selectedMonthKey]
  );
  const historicalExpenses = useMemo(
    () => expenseEntries.filter((e) => e.monthKey < selectedMonthKey).map(toFinanceExpense),
    [expenseEntries, selectedMonthKey]
  );

  // This month only
  const thisMonthIncome = useMemo(
    () => incomeEntries.filter((e) => e.monthKey === selectedMonthKey).map(toFinanceIncome),
    [incomeEntries, selectedMonthKey]
  );
  const thisMonthExpenses = useMemo(
    () => expenseEntries.filter((e) => e.monthKey === selectedMonthKey).map(toFinanceExpense),
    [expenseEntries, selectedMonthKey]
  );

  // Historical (before month) property distributions
  const historicalPropertySummaries = useMemo(
    () => calculatePropertySummaries(financeProps, historicalIncome, historicalExpenses),
    [financeProps, historicalIncome, historicalExpenses]
  );
  const allHistoricalDistributions = useMemo(
    () => calculatePropertyDistributions(historicalPropertySummaries, financeShares, financeMembers).distributions,
    [historicalPropertySummaries, financeShares, financeMembers]
  );

  // This month property distributions
  const thisMonthPropertySummaries = useMemo(
    () => calculatePropertySummaries(financeProps, thisMonthIncome, thisMonthExpenses),
    [financeProps, thisMonthIncome, thisMonthExpenses]
  );
  const thisMonthDistributions = useMemo(
    () => calculatePropertyDistributions(thisMonthPropertySummaries, financeShares, financeMembers),
    [thisMonthPropertySummaries, financeShares, financeMembers]
  );

  // Family earnings summary with running balances
  const familySummary = useMemo(
    () =>
      calculateFamilyEarningsSummary(thisMonthDistributions.distributions as PropertyDistributionResult[], {
        allHistoricalDistributions: allHistoricalDistributions as PropertyDistributionResult[],
        selectedMonthDistributions: thisMonthDistributions.distributions as PropertyDistributionResult[],
        allPayouts: payouts.map((p) => ({ memberId: p.memberId, amount: p.amount, monthKey: p.monthKey })),
        selectedMonthKey,
      }),
    [thisMonthDistributions, allHistoricalDistributions, payouts, selectedMonthKey]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 dark:text-slate-400 text-lg">
        Loading distribution data...
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between border-b pb-4 border-slate-200 dark:border-slate-800/60">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Distribution Overview</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Member earnings, running balances, and property payouts.</p>
        </div>

        {/* Month Selector */}
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60 rounded-xl px-4 py-2.5 shadow-sm">
          <CalendarDays size={18} className="text-slate-400" />
          <select
            className="text-sm font-medium text-slate-700 dark:text-slate-300 bg-transparent border-none outline-none cursor-pointer min-w-[140px]"
            value={selectedMonthKey}
            onChange={(e) => setSelectedMonthKey(e.target.value)}
          >
            {availableMonths.map((month) => (
              <option key={month} value={month}>
                {month === currentMonthKey ? `${month} (Current)` : month}
              </option>
            ))}
          </select>
        </div>
      </header>

      <FamilySummaryCards familySummary={familySummary} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <PropertyDistributionTable distributions={thisMonthDistributions.distributions as PropertyDistributionResult[]} />
        <FamilySummaryTable memberSummaries={familySummary.memberSummaries} />
      </div>

      {thisMonthDistributions.warnings.length > 0 && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
          <h3 className="font-semibold text-amber-800 mb-2">Warnings</h3>
          <ul className="list-disc list-inside text-amber-700 space-y-1 text-sm">
            {thisMonthDistributions.warnings.map((warning, index) => (
              <li key={index}>
                {warning.propertyName}: {warning.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
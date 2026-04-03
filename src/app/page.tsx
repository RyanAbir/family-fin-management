"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { testFirebaseConnection, isFirebaseConfigured } from "@/lib/firebase";
import type { SeedResult } from "@/lib/seed";
import type { FamilyMember, Property } from "@/types";
import { getAllIncomeEntries } from "@/lib/db/incomeEntries";
import { getAllExpenseEntries } from "@/lib/db/expenseEntries";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Home,
  Users,
  Activity,
  AlertCircle
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

function Card({
  title,
  value,
  color,
  icon: Icon,
}: {
  title: string;
  value: string;
  color: string;
  icon: React.ElementType;
}) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border p-6 shadow-sm transition-all hover:shadow-md ${color}`}>
      <div className="absolute right-4 top-4 opacity-20">
        <Icon size={64} />
      </div>
      <div className="relative">
        <div className="flex items-center gap-2 text-sm font-medium opacity-90">
          <Icon size={18} />
          {title}
        </div>
        <p className="mt-4 text-3xl font-bold tracking-tight">{value}</p>
      </div>
    </div>
  );
}

interface DashboardTransaction {
  id: string;
  type: "Income" | "Expense";
  category: string;
  amount: number;
  date: Date;
}

export default function Dashboard() {
  const [transactions, setTransactions] = useState<DashboardTransaction[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [summary, setSummary] = useState({ income: 0, expense: 0, net: 0 });
  const [chartData, setChartData] = useState<{ month: string; income: number; expense: number }[]>([]);
  const [firebaseStatus, setFirebaseStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const [seedResult, setSeedResult] = useState<SeedResult | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const membersSnapshot = await getDocs(collection(db, "family_members"));
        const membersData = membersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as FamilyMember[];
        setFamilyMembers(membersData);

        const propertiesSnapshot = await getDocs(collection(db, "properties"));
        const propertiesData = propertiesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Property[];
        setProperties(propertiesData);

        const [incomeData, expenseData] = await Promise.all([
          getAllIncomeEntries(),
          getAllExpenseEntries(),
        ]);

        const totalIncome = incomeData.reduce((sum, item) => sum + item.amount, 0);
        const totalExpense = expenseData.reduce((sum, item) => sum + item.amount, 0);

        setSummary({
          income: totalIncome,
          expense: totalExpense,
          net: totalIncome - totalExpense,
        });

        const unifiedTrans: DashboardTransaction[] = [
          ...incomeData.map((inc) => ({
            id: inc.id,
            type: "Income" as const,
            category: inc.category,
            amount: inc.amount,
            date: inc.date,
          })),
          ...expenseData.map((exp) => ({
            id: exp.id,
            type: "Expense" as const,
            category: exp.category,
            amount: exp.amount,
            date: exp.date,
          })),
        ];

        unifiedTrans.sort((a, b) => b.date.getTime() - a.date.getTime());
        setTransactions(unifiedTrans.slice(0, 5));

        // Grouping Data for Charting
        const monthlyData = new Map<string, { month: string; income: number; expense: number }>();
        
        incomeData.forEach(inc => {
          const month = inc.monthKey || "Unknown";
          if (!monthlyData.has(month)) monthlyData.set(month, { month, income: 0, expense: 0 });
          monthlyData.get(month)!.income += inc.amount;
        });

        expenseData.forEach(exp => {
          const month = exp.monthKey || "Unknown";
          if (!monthlyData.has(month)) monthlyData.set(month, { month, income: 0, expense: 0 });
          monthlyData.get(month)!.expense += exp.amount;
        });

        setChartData(Array.from(monthlyData.values()).sort((a, b) => a.month.localeCompare(b.month)));

        setFirebaseStatus(await testFirebaseConnection());
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between border-b pb-4 border-slate-200">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard Overview</h2>
          <p className="text-sm text-slate-500 mt-1">Analyze and review your financial performance seamlessly.</p>
        </div>
      </header>

      {/* Firebase Status Banner */}
      {!isFirebaseConfigured() && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 text-amber-800 border border-amber-200">
          <AlertCircle size={20} />
          <div>
            <p className="text-sm font-semibold">Configuration Missing</p>
            <p className="text-xs mt-0.5">Please set up your Firebase environment variables in .env.local to access live data.</p>
          </div>
        </div>
      )}

      {/* Key Metrics */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card
          title="Total Income"
          value={`BDT ${summary.income.toLocaleString()}`}
          color="bg-gradient-to-br from-emerald-500 to-emerald-700 text-white border-emerald-600"
          icon={TrendingUp}
        />
        <Card
          title="Total Expenses"
          value={`BDT ${summary.expense.toLocaleString()}`}
          color="bg-gradient-to-br from-rose-500 to-rose-700 text-white border-rose-600"
          icon={TrendingDown}
        />
        <Card
          title="Net Profit"
          value={`BDT ${summary.net.toLocaleString()}`}
          color={
            summary.net >= 0
              ? "bg-gradient-to-br from-blue-500 to-indigo-700 text-white border-indigo-600"
              : "bg-gradient-to-br from-orange-400 to-rose-600 text-white border-rose-500"
          }
          icon={Wallet}
        />
      </section>

      {/* Chart Section */}
      {chartData.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Activity className="text-blue-500" size={20} />
              Income vs Expenses
            </h3>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748B" }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748B" }} tickFormatter={(value) => `৳${value.toLocaleString()}`} />
                <Tooltip
                  cursor={{ fill: "#F1F5F9" }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any) => [`BDT ${Number(value).toLocaleString()}`, undefined]}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="income" name="Income" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={60} />
                <Bar dataKey="expense" name="Expenses" fill="#F43F5E" radius={[4, 4, 0, 0]} maxBarSize={60} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* Detail Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Recent Transactions */}
        <section className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Activity size={18} className="text-slate-500" />
              Latest Transactions
            </h3>
          </div>
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Type</th>
                  <th className="px-6 py-3 font-medium">Category</th>
                  <th className="px-6 py-3 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.length > 0 ? (
                  transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 text-slate-600">
                        {transaction.date ? transaction.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : "N/A"}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          transaction.type === "Income" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                        }`}>
                          {transaction.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-700">{transaction.category}</td>
                      <td className={`px-6 py-4 text-right font-medium ${
                        transaction.type === "Income" ? "text-emerald-600" : "text-rose-600"
                      }`}>
                        {transaction.type === "Income" ? "+" : "-"}BDT {transaction.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500 bg-slate-50/30">
                      No recent activities available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <div className="space-y-8">
          {/* Active Properties */}
          <section className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Home size={18} className="text-slate-500" />
                Properties Listing
              </h3>
            </div>
            <div className="p-0 overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-6 py-3 font-medium">Name</th>
                    <th className="px-6 py-3 font-medium">Type</th>
                    <th className="px-6 py-3 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {properties.length > 0 ? (
                    properties.map((property) => (
                      <tr key={property.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-3 font-medium text-slate-700">{property.name}</td>
                        <td className="px-6 py-3 text-slate-500">{property.type}</td>
                        <td className="px-6 py-3 text-right">
                          <span className={`inline-flex items-center w-2 h-2 rounded-full mr-2 ${
                            property.isActive ? "bg-emerald-500" : "bg-slate-300"
                          }`} />
                          <span className={property.isActive ? "text-slate-700" : "text-slate-500"}>
                            {property.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-6 py-8 text-center text-slate-500 bg-slate-50/30">
                        No properties found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Family Members */}
          <section className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Users size={18} className="text-slate-500" />
                Family Cohort
              </h3>
            </div>
            <div className="p-0 overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-6 py-3 font-medium">Member Name</th>
                    <th className="px-6 py-3 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {familyMembers.length > 0 ? (
                    familyMembers.map((member: FamilyMember) => (
                      <tr key={member.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-3 font-medium text-slate-700">{member.name}</td>
                        <td className="px-6 py-3 text-right">
                          <span className={`inline-flex items-center w-2 h-2 rounded-full mr-2 ${
                            member.isActive ? "bg-emerald-500" : "bg-slate-300"
                          }`} />
                          <span className={member.isActive ? "text-slate-700" : "text-slate-500"}>
                            {member.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={2} className="px-6 py-8 text-center text-slate-500 bg-slate-50/30">
                        No family members documented.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
        
      </div>
    </div>
  );
}

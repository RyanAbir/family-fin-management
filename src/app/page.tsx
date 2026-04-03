"use client";

import { useEffect, useState, useMemo } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { testFirebaseConnection, isFirebaseConfigured } from "@/lib/firebase";
import type { FamilyMember, Property, OwnershipShare } from "@/types";
import { getAllIncomeEntries } from "@/lib/db/incomeEntries";
import { getAllExpenseEntries } from "@/lib/db/expenseEntries";
import { getAllOwnershipShares } from "@/lib/db/ownershipShares";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Home,
  Users,
  Activity,
  AlertCircle,
  PieChart as PieIcon,
  BarChart3,
  CalendarDays,
  ArrowRight
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from "recharts";
import { formatCurrency, round2 } from "@/lib/finance/helpers";

function Card({
  title,
  value,
  color,
  icon: Icon,
}: {
  title: string;
  value: string | number;
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

const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#F43F5E', '#8B5CF6', '#06B6D4'];

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
  const [ownershipShares, setOwnershipShares] = useState<OwnershipShare[]>([]);
  const [summary, setSummary] = useState({ income: 0, expense: 0, net: 0 });
  const [chartData, setChartData] = useState<{ month: string; income: number; expense: number }[]>([]);
  const [propertyPerformance, setPropertyPerformance] = useState<{ propertyName: string; income: number }[]>([]);
  const [familyDistribution, setFamilyDistribution] = useState<{ name: string; value: number }[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [firebaseStatus, setFirebaseStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [membersSnapshot, propertiesSnapshot, incomeData, expenseData, sharesData] = await Promise.all([
          getDocs(collection(db, "family_members")),
          getDocs(collection(db, "properties")),
          getAllIncomeEntries(),
          getAllExpenseEntries(),
          getAllOwnershipShares()
        ]);

        const membersList = membersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as FamilyMember[];
        const propsList = propertiesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Property[];
        
        setFamilyMembers(membersList);
        setProperties(propsList);
        setOwnershipShares(sharesData);

        const totalIncome = incomeData.reduce((sum, item) => sum + item.amount, 0);
        const totalExpense = expenseData.reduce((sum, item) => sum + item.amount, 0);

        setSummary({
          income: totalIncome,
          expense: totalExpense,
          net: totalIncome - totalExpense,
        });

        // 1. Unified Transactions (Top 5)
        const unifiedTrans: DashboardTransaction[] = [
          ...incomeData.map(inc => ({ id: inc.id, type: "Income" as const, category: inc.category, amount: inc.amount, date: inc.date })),
          ...expenseData.map(exp => ({ id: exp.id, type: "Expense" as const, category: exp.category, amount: exp.amount, date: exp.date })),
        ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5);
        setTransactions(unifiedTrans);

        // 2. Monthly Data Processing (Trends)
        const monthlyMap = new Map<string, { month: string; income: number; expense: number }>();
        incomeData.forEach(inc => {
          const month = inc.monthKey || "Unknown";
          if (!monthlyMap.has(month)) monthlyMap.set(month, { month, income: 0, expense: 0 });
          monthlyMap.get(month)!.income += inc.amount;
        });
        expenseData.forEach(exp => {
          const month = exp.monthKey || "Unknown";
          if (!monthlyMap.has(month)) monthlyMap.set(month, { month, income: 0, expense: 0 });
          monthlyMap.get(month)!.expense += exp.amount;
        });
        setChartData(Array.from(monthlyMap.values()).sort((a, b) => a.month.localeCompare(b.month)));

        // 3. Property Performance (Income by Property)
        const propPerfMap = new Map<string, number>();
        incomeData.forEach(inc => {
          const property = propsList.find(p => p.id === inc.propertyId)?.name || "Other";
          propPerfMap.set(property, (propPerfMap.get(property) || 0) + inc.amount);
        });
        setPropertyPerformance(Array.from(propPerfMap.entries()).map(([propertyName, income]) => ({ propertyName, income })).sort((a,b) => b.income - a.income));

        // 4. Family Distribution (Based on ownership and total net property profit)
        const familyMap = new Map<string, number>();
        const propertyNetMap = new Map<string, number>();
        
        // Calculate total net profit per property across all time
        propsList.forEach(p => {
          const pIncome = incomeData.filter(inc => inc.propertyId === p.id).reduce((s, i) => s + i.amount, 0);
          const pExpense = expenseData.filter(exp => exp.propertyId === p.id).reduce((s, e) => s + e.amount, 0);
          propertyNetMap.set(p.id, pIncome - pExpense);
        });

        // Distribute to members based on shares
        sharesData.forEach(share => {
          const propertyNet = propertyNetMap.get(share.propertyId) || 0;
          if (propertyNet > 0) {
            const memberName = membersList.find(m => m.id === share.memberId)?.name || "Unknown";
            const shareAmount = round2(propertyNet * (share.percentage / 100));
            familyMap.set(memberName, (familyMap.get(memberName) || 0) + shareAmount);
          }
        });
        setFamilyDistribution(Array.from(familyMap.entries()).map(([name, value]) => ({ name, value })));

        setFirebaseStatus(await testFirebaseConnection());
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const topProperty = propertyPerformance[0]?.propertyName || "N/A";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-slate-500 animate-pulse text-lg font-medium">Crunching your financial data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      <header className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between border-b pb-4 border-slate-200">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard Overview</h2>
          <p className="text-sm text-slate-500 mt-1">Holistic view of your property portfolio and family distribution.</p>
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
      <section className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card
          title="Total Income"
          value={formatCurrency(summary.income)}
          color="bg-gradient-to-br from-emerald-500 to-emerald-700 text-white border-emerald-600"
          icon={TrendingUp}
        />
        <Card
          title="Total Expenses"
          value={formatCurrency(summary.expense)}
          color="bg-gradient-to-br from-rose-500 to-rose-700 text-white border-rose-600"
          icon={TrendingDown}
        />
        <Card
          title="Net Profit"
          value={formatCurrency(summary.net)}
          color={
            summary.net >= 0
              ? "bg-gradient-to-br from-blue-500 to-indigo-700 text-white border-indigo-600"
              : "bg-gradient-to-br from-orange-400 to-rose-600 text-white border-rose-500"
          }
          icon={Wallet}
        />
        <Card
          title="Total Properties"
          value={properties.length}
          color="bg-gradient-to-br from-slate-700 to-slate-900 text-white border-slate-800"
          icon={Home}
        />
      </section>

      {/* Primary Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Income vs Expense Bar Chart */}
        <section className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-8 text-slate-900">
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

        {/* Family Distribution Pie Chart */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-8">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <PieIcon className="text-indigo-500" size={20} />
              Family Distribution
            </h3>
            <p className="text-xs text-slate-500 mt-1">Portfolio net share distribution.</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={familyDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {familyDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any) => [formatCurrency(Number(value)), 'Share']}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
             {familyDistribution.map((entry, index) => (
               <div key={entry.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-slate-600">{entry.name}</span>
                  </div>
                  <span className="font-semibold text-slate-900">{formatCurrency(entry.value)}</span>
               </div>
             ))}
          </div>
        </section>
      </div>

      {/* Secondary Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Income by Property Bar Chart */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
           <div className="mb-8">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="text-emerald-500" size={20} />
              Income by Property
            </h3>
            <p className="text-xs text-slate-500 mt-1">Comparing revenue streams across active properties.</p>
          </div>
          <div className="h-64 w-full text-slate-900">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={propertyPerformance}>
                <XAxis dataKey="propertyName" hide />
                <Tooltip 
                   // eslint-disable-next-line @typescript-eslint/no-explicit-any
                   formatter={(value: any) => [formatCurrency(Number(value)), 'Total Income']}
                   contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="income" fill="#10B981" radius={[8, 8, 8, 8]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 space-y-3">
             {propertyPerformance.slice(0, 3).map((prop, idx) => (
               <div key={prop.propertyName} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-400">0{idx + 1}</span>
                    <span className="text-sm font-semibold text-slate-700">{prop.propertyName}</span>
                  </div>
                  <span className="text-sm font-bold text-emerald-600">{formatCurrency(prop.income)}</span>
               </div>
             ))}
             {propertyPerformance.length === 0 && <p className="text-center py-4 text-slate-400 italic text-sm">No property earnings recorded yet.</p>}
          </div>
        </section>

        {/* Monthly Income Trend Line Chart */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-8">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Activity className="text-rose-500" size={20} />
              Monthly Profit Trend
            </h3>
            <p className="text-xs text-slate-500 mt-1">Visualizing net growth month-over-month.</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" hide />
                <Tooltip 
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any, name: any) => [formatCurrency(Number(value)), String(name).charAt(0).toUpperCase() + String(name).slice(1)]}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey={(d) => d.income - d.expense} name="Net Profit" stroke="#6366F1" fillOpacity={1} fill="url(#colorProfit)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 p-4 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <TrendingUp size={20} />
               </div>
               <div>
                  <p className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">Top Property</p>
                  <p className="text-sm font-bold text-slate-800">{topProperty}</p>
               </div>
            </div>
            <ArrowRight className="text-indigo-300" />
          </div>
        </section>
      </div>

      {/* Detail Tables Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* Monthly Summary Table */}
        <section className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <CalendarDays size={18} className="text-slate-500" />
              Monthly Performance Log
            </h3>
          </div>
          <div className="p-0 overflow-x-auto">
            <div className="min-w-[600px]">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-6 py-4 font-medium">Month</th>
                    <th className="px-6 py-4 font-medium text-right">Income</th>
                    <th className="px-6 py-4 font-medium text-right">Expenses</th>
                    <th className="px-6 py-4 font-medium text-right">Net Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {chartData.length > 0 ? (
                    [...chartData].reverse().map((data) => (
                      <tr key={data.month} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-700">{data.month}</td>
                        <td className="px-6 py-4 text-right text-emerald-600 font-medium">{formatCurrency(data.income)}</td>
                        <td className="px-6 py-4 text-right text-rose-600 font-medium">{formatCurrency(data.expense)}</td>
                        <td className={`px-6 py-4 text-right font-bold ${data.income - data.expense >= 0 ? "text-indigo-600" : "text-orange-600"}`}>
                          {formatCurrency(data.income - data.expense)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-500 bg-slate-50/30 font-medium italic">
                        No monthly summaries available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Recent Transactions List */}
        <section className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Activity size={18} className="text-slate-500" />
              Recent Activities
            </h3>
          </div>
          <div className="p-0 overflow-x-auto">
            <div className="min-w-[500px]">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-6 py-4 font-medium">Date</th>
                    <th className="px-6 py-4 font-medium">Type</th>
                    <th className="px-6 py-4 font-medium">Category</th>
                    <th className="px-6 py-4 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.length > 0 ? (
                    transactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4 text-slate-600">
                          {transaction.date ? transaction.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : "N/A"}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                            transaction.type === "Income" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                          }`}>
                            {transaction.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-700 font-medium">{transaction.category}</td>
                        <td className={`px-6 py-4 text-right font-bold ${
                          transaction.type === "Income" ? "text-emerald-600" : "text-rose-600"
                        }`}>
                          {transaction.type === "Income" ? "+" : "-"}{transaction.amount.toLocaleString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-500 bg-slate-50/30 font-medium italic">
                        No recent activities available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>

      {/* Portfolio Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Active Properties */}
          <section className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Home size={18} className="text-slate-500" />
                Active Portfolio
              </h3>
            </div>
            <div className="p-0 overflow-x-auto">
              <div className="min-w-[400px]">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-6 py-4 font-medium">Name</th>
                      <th className="px-6 py-4 font-medium">Type</th>
                      <th className="px-6 py-4 font-medium text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {properties.length > 0 ? (
                      properties.map((property) => (
                        <tr key={property.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-6 py-4 font-semibold text-slate-800">{property.name}</td>
                          <td className="px-6 py-4 text-slate-500">{property.type}</td>
                          <td className="px-6 py-4 text-right">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-bold ${
                              property.isActive ? "text-emerald-600 bg-emerald-50" : "text-slate-500 bg-slate-50"
                            }`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${property.isActive ? "bg-emerald-500" : "bg-slate-300"}`} />
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
            </div>
          </section>

          {/* Family Members */}
          <section className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Users size={18} className="text-slate-500" />
                Registered Members
              </h3>
            </div>
            <div className="p-0 overflow-x-auto">
              <div className="min-w-[400px]">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-6 py-4 font-medium">Member Name</th>
                      <th className="px-6 py-4 font-medium text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {familyMembers.length > 0 ? (
                      familyMembers.map((member: FamilyMember) => (
                        <tr key={member.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-6 py-4 font-semibold text-slate-800">{member.name}</td>
                          <td className="px-6 py-4 text-right">
                             <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-bold ${
                              member.isActive ? "text-indigo-600 bg-indigo-50" : "text-slate-500 bg-slate-50"
                            }`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${member.isActive ? "bg-indigo-500" : "bg-slate-300"}`} />
                              {member.isActive ? "Active" : "Regular"}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={2} className="px-6 py-8 text-center text-slate-500 bg-slate-50/30 font-medium italic">
                          No family members documented.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
      </div>
    </div>
  );
}

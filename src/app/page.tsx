"use client";

import { useEffect, useState, useMemo } from "react";
import { collection, getDocs, limit, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { isFirebaseConfigured } from "@/lib/firebase";
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
  ArrowUpRight,
  Plus,
  ArrowRight,
  ArrowDownRight,
  Target,
  Zap
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
  Area,
  Line,
  LineChart
} from "recharts";
import { formatCurrency, round2 } from "@/lib/finance/helpers";
import { DashboardSkeleton } from "@/components/ui/SkeletonLoaders";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

function MetricCard({
  title,
  value,
  subtitle,
  trend,
  color,
  icon: Icon,
  chartData
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: { value: number; isPositive: boolean };
  color: "indigo" | "emerald" | "rose" | "amber" | "slate";
  icon: React.ElementType;
  chartData?: any[];
}) {
  const colorMap = {
    indigo: "from-indigo-500 to-violet-600 shadow-indigo-100 ring-indigo-50",
    emerald: "from-emerald-500 to-teal-600 shadow-emerald-100 ring-emerald-50",
    rose: "from-rose-500 to-pink-600 shadow-rose-100 ring-rose-50",
    amber: "from-amber-500 to-orange-600 shadow-amber-100 ring-amber-50",
    slate: "from-slate-700 to-slate-900 shadow-slate-100 ring-slate-50"
  };

  const bgGlow = {
    indigo: "bg-indigo-500/10",
    emerald: "bg-emerald-500/10",
    rose: "bg-rose-500/10",
    amber: "bg-amber-500/10",
    slate: "bg-slate-500/10"
  };

  const iconColor = {
    indigo: "text-indigo-600 bg-indigo-50",
    emerald: "text-emerald-600 bg-emerald-50",
    rose: "text-rose-600 bg-rose-50",
    amber: "text-amber-600 bg-amber-50",
    slate: "text-slate-600 bg-slate-50"
  };

  return (
    <div className="group relative overflow-hidden rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm transition-all hover:shadow-2xl hover:shadow-slate-200/50 hover:border-indigo-100 hover:-translate-y-1">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-2xl ${iconColor[color]} transition-colors group-hover:bg-indigo-600 group-hover:text-white`}>
          <Icon size={24} />
        </div>
        {trend && (
           <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${trend.isPositive ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
              {trend.isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {trend.value}%
           </div>
        )}
      </div>
      
      <div className="space-y-1">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</p>
        <h3 className="text-3xl font-black text-slate-900 tracking-tight">{value}</h3>
        {subtitle && <p className="text-[10px] font-medium text-slate-400">{subtitle}</p>}
      </div>

      {chartData && (
        <div className="h-12 w-full mt-4 -mx-2 opacity-50 group-hover:opacity-100 transition-opacity">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color === 'rose' ? '#F43F5E' : '#6366F1'} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={color === 'rose' ? '#F43F5E' : '#6366F1'} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke={color === 'rose' ? '#F43F5E' : '#6366F1'} 
                strokeWidth={2} 
                fillOpacity={1} 
                fill={`url(#gradient-${color})`} 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
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
  const { user, profile } = useAuth();
  const userName = profile?.displayName || user?.displayName || "Member";
  const firstName = userName.split(" ")[0];

  const [transactions, setTransactions] = useState<DashboardTransaction[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [summary, setSummary] = useState({ income: 0, expense: 0, net: 0 });
  const [chartData, setChartData] = useState<{ month: string; income: number; expense: number; value: number }[]>([]);
  const [propertyPerformance, setPropertyPerformance] = useState<{ propertyName: string; income: number }[]>([]);
  const [familyDistribution, setFamilyDistribution] = useState<{ name: string; value: number }[]>([]);
  
  const [loading, setLoading] = useState(true);

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

        const totalIncome = incomeData.reduce((sum, item) => sum + item.amount, 0);
        const totalExpense = expenseData.reduce((sum, item) => sum + item.amount, 0);

        setSummary({
          income: totalIncome,
          expense: totalExpense,
          net: totalIncome - totalExpense,
        });

        const unifiedTrans: DashboardTransaction[] = [
          ...incomeData.map(inc => ({ id: inc.id, type: "Income" as const, category: inc.category, amount: inc.amount, date: inc.date })),
          ...expenseData.map(exp => ({ id: exp.id, type: "Expense" as const, category: exp.category, amount: exp.amount, date: exp.date })),
        ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 8);
        setTransactions(unifiedTrans);

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
        
        const sortedMonthly = Array.from(monthlyMap.values())
          .sort((a, b) => a.month.localeCompare(b.month))
          .map(d => ({ ...d, value: d.income }));
          
        setChartData(sortedMonthly);

        const propPerfMap = new Map<string, number>();
        incomeData.forEach(inc => {
          const property = propsList.find(p => p.id === inc.propertyId)?.name || "Other";
          propPerfMap.set(property, (propPerfMap.get(property) || 0) + inc.amount);
        });
        setPropertyPerformance(Array.from(propPerfMap.entries()).map(([propertyName, income]) => ({ propertyName, income })).sort((a,b) => b.income - a.income));

        const familyMap = new Map<string, number>();
        const propertyNetMap = new Map<string, number>();
        
        propsList.forEach(p => {
          const pIncome = incomeData.filter(inc => inc.propertyId === p.id).reduce((s, i) => s + i.amount, 0);
          const pExpense = expenseData.filter(exp => exp.propertyId === p.id).reduce((s, e) => s + e.amount, 0);
          propertyNetMap.set(p.id, pIncome - pExpense);
        });

        sharesData.forEach(share => {
          const propertyNet = propertyNetMap.get(share.propertyId) || 0;
          if (propertyNet > 0) {
            const memberName = membersList.find(m => m.id === share.memberId)?.name || "Unknown";
            const shareAmount = round2(propertyNet * (share.percentage / 100));
            familyMap.set(memberName, (familyMap.get(memberName) || 0) + shareAmount);
          }
        });
        setFamilyDistribution(Array.from(familyMap.entries()).map(([name, value]) => ({ name, value })));

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
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-10 animate-stagger pb-12">
      {/* Dynamic Header */}
      <header className="relative p-10 rounded-[3rem] bg-slate-900 text-white overflow-hidden shadow-2xl shadow-slate-200">
        <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
           <Zap size={240} className="text-indigo-400" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
           <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl font-black tracking-tight font-heading leading-tight">
                 Hello, <span className="text-indigo-400">{firstName}.</span>
              </h1>
              <p className="text-slate-400 font-medium max-w-md">
                 Your portfolio is growing. You have <span className="text-white font-bold">{properties.length} active properties</span> generating value today.
              </p>
           </div>
           
           <div className="flex flex-wrap gap-4">
              <Link href="/income" className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-2xl text-sm font-bold shadow-xl shadow-indigo-900/40 transition-all active:scale-95">
                 <Plus size={18} />
                 Record Income
              </Link>
              <Link href="/expenses" className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl text-sm font-bold border border-white/10 transition-all active:scale-95">
                 <TrendingDown size={18} />
                 Log Expense
              </Link>
           </div>
        </div>
      </header>

      {/* Key Metrics Grid */}
      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Income"
          value={formatCurrency(summary.income)}
          subtitle="Net revenue from all time"
          trend={{ value: 12.5, isPositive: true }}
          color="emerald"
          icon={TrendingUp}
          chartData={chartData.slice(-6)}
        />
        <MetricCard
          title="Total Expenses"
          value={formatCurrency(summary.expense)}
          subtitle="All costs documented"
          trend={{ value: 4.2, isPositive: false }}
          color="rose"
          icon={TrendingDown}
          chartData={chartData.slice(-6).map(d => ({ ...d, value: d.expense }))}
        />
        <MetricCard
          title="Net Profit"
          value={formatCurrency(summary.net)}
          subtitle="Available for distribution"
          trend={{ value: 8.9, isPositive: summary.net >= 0 }}
          color="indigo"
          icon={Wallet}
          chartData={chartData.slice(-6).map(d => ({ ...d, value: d.income - d.expense }))}
        />
        <MetricCard
          title="Portfolio Reach"
          value={properties.length}
          subtitle="Active properties tracked"
          color="slate"
          icon={Home}
        />
      </section>

      {/* Analytics Clusters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Growth Trends */}
        <section className="lg:col-span-2 rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-sm hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-10">
             <div className="space-y-1">
                <h3 className="text-xl font-black text-slate-900 font-heading tracking-tight flex items-center gap-2">
                   <Target className="text-indigo-600" size={24} />
                   Financial Performance
                </h3>
                <p className="text-xs font-medium text-slate-400">Monthly breakdown of income and expenditures.</p>
             </div>
             <div className="flex gap-2">
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400"><Activity size={14} /></div>
             </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 700 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 700 }} tickFormatter={(value) => `৳${value.toLocaleString()}`} />
                <Tooltip
                  cursor={{ fill: "#f8fafc", radius: 8 }}
                  contentStyle={{ 
                    borderRadius: '20px', 
                    border: 'none', 
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                    padding: '16px'
                  }}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any) => [`৳ ${Number(value).toLocaleString()}`, undefined]}
                />
                <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '30px' }} />
                <Bar dataKey="income" name="Income" fill="#4f46e5" radius={[6, 6, 0, 0]} maxBarSize={40} />
                <Bar dataKey="expense" name="Spending" fill="#f43f5e" radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Share Distribution */}
        <section className="rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-sm hover:shadow-xl transition-shadow flex flex-col">
          <div className="mb-10">
             <h3 className="text-xl font-black text-slate-900 font-heading tracking-tight flex items-center gap-2">
                <PieIcon className="text-indigo-500" size={24} />
                Equity Split
             </h3>
             <p className="text-xs font-medium text-slate-400 mt-1">Portfolio net share distribution among members.</p>
          </div>
          <div className="h-64 w-full flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={familyDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                  animationBegin={200}
                >
                  {familyDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(255,255,255,0.5)" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any) => [formatCurrency(Number(value)), 'Share']}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3">
             {familyDistribution.map((entry, index) => (
               <div key={entry.name} className="flex flex-col p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">{entry.name}</span>
                  </div>
                  <span className="text-sm font-black text-slate-900">{formatCurrency(entry.value)}</span>
               </div>
             ))}
          </div>
        </section>
      </div>

      {/* Transaction Feed & Summary */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
         <section className="xl:col-span-3 rounded-[2.5rem] bg-white shadow-sm border border-slate-100 overflow-hidden flex flex-col hover:shadow-xl transition-shadow">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-xl font-black text-slate-900 font-heading tracking-tight">Recent Activity</h3>
                <p className="text-xs font-medium text-slate-400">Latest income and expense entries posted.</p>
              </div>
              <button className="text-xs font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-700 transition-colors">View All</button>
            </div>
            <div className="p-0 overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <tbody className="divide-y divide-slate-50">
                  {transactions.length > 0 ? (
                    transactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-indigo-50/30 transition-colors group">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                             <div className={`p-2.5 rounded-xl ${transaction.type === 'Income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                {transaction.type === 'Income' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                             </div>
                             <div>
                                <p className="font-bold text-slate-900 leading-none mb-1 group-hover:text-indigo-600 transition-colors">{transaction.category}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                   {transaction.date ? transaction.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : "N/A"}
                                </p>
                             </div>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-right">
                           <p className={`text-sm font-black ${transaction.type === 'Income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {transaction.type === 'Income' ? "+" : "-"}{transaction.amount.toLocaleString()}
                           </p>
                           <p className="text-[10px] text-slate-400 font-medium">Successful</p>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={2} className="px-8 py-20 text-center text-slate-400 font-bold uppercase tracking-widest italic opacity-50">No activity yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
         </section>

         <div className="xl:col-span-2 space-y-8">
            {/* Top Property Widget */}
            <section className="rounded-[2.5rem] p-8 bg-gradient-to-br from-indigo-600 to-indigo-900 text-white shadow-2xl shadow-indigo-100 flex items-center gap-6 group hover:-translate-y-1 transition-all">
               <div className="p-5 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20">
                  <Building2 size={32} className="text-white group-hover:scale-110 transition-transform" />
               </div>
               <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300 mb-1">Top Performing</p>
                  <h4 className="text-xl font-black truncate">{topProperty}</h4>
                  <div className="flex items-center gap-2 mt-2">
                     <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-300 w-[75%]" />
                     </div>
                     <span className="text-[10px] font-bold">Trending High</span>
                  </div>
               </div>
            </section>

            {/* Portfolio Diversity */}
            <section className="rounded-[2.5rem] p-8 bg-white border border-slate-100 shadow-sm hover:shadow-xl transition-shadow">
               <h3 className="text-md font-black text-slate-900 font-heading mb-6 tracking-tight">Portfolio Diversity</h3>
               <div className="space-y-5">
                  {propertyPerformance.slice(0, 4).map((prop, idx) => (
                    <div key={prop.propertyName} className="group cursor-default">
                       <div className="flex justify-between items-center mb-1.5">
                          <p className="text-xs font-bold text-slate-700 truncate pr-4">{prop.propertyName}</p>
                          <p className="text-xs font-black text-indigo-600 shrink-0">{formatCurrency(prop.income)}</p>
                       </div>
                       <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                          <div 
                             className="h-full bg-indigo-500 rounded-full transition-all duration-1000" 
                             style={{ width: `${Math.min(100, (prop.income / summary.income) * 100)}%`, transitionDelay: `${idx * 100}ms` }} 
                          />
                       </div>
                    </div>
                  ))}
                  {propertyPerformance.length === 0 && <p className="text-xs text-slate-400 italic">No income data to diversify.</p>}
               </div>
               <Link href="/properties" className="mt-8 flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-all">
                  Full Analytics <ArrowRight size={14} />
               </Link>
            </section>
         </div>
      </div>
    </div>
  );
}

// Ensure Building2 is imported
import { Building2 } from "lucide-react";

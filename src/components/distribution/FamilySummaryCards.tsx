import type { FamilyEarningsSummary } from "@/lib/finance/types";
import { formatCurrency } from "@/lib/finance/helpers";
import { TrendingUp, TrendingDown, Wallet, Users } from "lucide-react";

interface FamilySummaryCardsProps {
  familySummary: FamilyEarningsSummary;
}

function Card({ title, value, color, icon: Icon }: { title: string; value: string | number; color: string; icon: React.ElementType }) {
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

export function FamilySummaryCards({ familySummary }: FamilySummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card
        title="Total Family Income"
        value={formatCurrency(familySummary.totalFamilyIncome)}
        color="bg-gradient-to-br from-emerald-500 to-emerald-700 text-white border-emerald-600"
        icon={TrendingUp}
      />
      <Card
        title="Total Family Expenses"
        value={formatCurrency(familySummary.totalFamilyExpenses)}
        color="bg-gradient-to-br from-rose-500 to-rose-700 text-white border-rose-600"
        icon={TrendingDown}
      />
      <Card
        title="Net Family Income"
        value={formatCurrency(familySummary.netFamilyIncome)}
        color={
          familySummary.netFamilyIncome >= 0
            ? "bg-gradient-to-br from-blue-500 to-indigo-700 text-white border-indigo-600"
            : "bg-gradient-to-br from-orange-400 to-rose-600 text-white border-rose-500"
        }
        icon={Wallet}
      />
      <Card
        title="Family Members"
        value={familySummary.memberSummaries.length}
        color="bg-gradient-to-br from-slate-700 to-slate-900 text-white border-slate-800"
        icon={Users}
      />
    </div>
  );
}
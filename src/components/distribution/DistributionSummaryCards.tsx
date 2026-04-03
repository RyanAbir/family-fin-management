import type { DashboardSummary } from "@/lib/summary/types";
import { formatCurrency } from "@/lib/finance/helpers";

interface DistributionSummaryCardsProps {
  summary: DashboardSummary;
}

export function DistributionSummaryCards({ summary }: DistributionSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="rounded-xl border p-5 shadow-sm bg-white">
        <p className="text-sm font-medium text-slate-600">Total Net Income</p>
        <p className="mt-2 text-2xl font-semibold text-slate-900">
          {formatCurrency(summary.totalNetIncome)}
        </p>
      </div>

      <div className="rounded-xl border p-5 shadow-sm bg-white">
        <p className="text-sm font-medium text-slate-600">Total Distributed</p>
        <p className="mt-2 text-2xl font-semibold text-slate-900">
          {formatCurrency(summary.totalDistributedAmount)}
        </p>
      </div>

      <div className="rounded-xl border p-5 shadow-sm bg-white">
        <p className="text-sm font-medium text-slate-600">Active Properties</p>
        <p className="mt-2 text-2xl font-semibold text-slate-900">
          {summary.activePropertiesCount}
        </p>
      </div>

      <div className="rounded-xl border p-5 shadow-sm bg-white">
        <p className="text-sm font-medium text-slate-600">Family Members</p>
        <p className="mt-2 text-2xl font-semibold text-slate-900">
          {summary.activeFamilyMembersCount}
        </p>
      </div>
    </div>
  );
}

import type { MemberDistribution } from "@/lib/finance/types";
import { formatCurrency } from "@/lib/finance/helpers";
import { UserCircle2, Building2, TrendingUp, TrendingDown, ArrowRight, History } from "lucide-react";

interface FamilySummaryTableProps {
  memberSummaries: MemberDistribution[];
}

function BalanceRow({
  label,
  value,
  icon: Icon,
  color,
  sign,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  sign?: "+" | "-";
}) {
  return (
    <div className="flex items-center justify-between text-sm py-1.5">
      <span className={`flex items-center gap-1.5 ${color} font-medium`}>
        <Icon size={14} />
        {label}
      </span>
      <span className={`font-bold ${color}`}>
        {sign}{formatCurrency(Math.abs(value))}
      </span>
    </div>
  );
}

export function FamilySummaryTable({ memberSummaries }: FamilySummaryTableProps) {
  if (memberSummaries.length === 0) {
    return <p className="text-slate-500 text-center py-8">No family member summaries found.</p>;
  }

  return (
    <section className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <UserCircle2 size={20} className="text-slate-500" />
          Member Running Balances
        </h3>
      </div>
      <div className="p-6 flex flex-col gap-4 bg-slate-50/30 overflow-y-auto">
        {memberSummaries.map((memberSummary) => {
          const isPositive = memberSummary.currentNetBalance >= 0;
          return (
            <div
              key={memberSummary.memberId}
              className="rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <h4 className="font-bold text-slate-800 text-base flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold shrink-0">
                    {memberSummary.memberName.charAt(0).toUpperCase()}
                  </div>
                  {memberSummary.memberName}
                </h4>
                {/* Current Net Balance badge */}
                <div className={`px-3 py-1 rounded-full text-sm font-bold border ${
                  isPositive
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-rose-50 text-rose-700 border-rose-200"
                }`}>
                  {isPositive ? "+" : "-"}{formatCurrency(Math.abs(memberSummary.currentNetBalance))}
                </div>
              </div>

              {/* Balance breakdown */}
              <div className="px-5 py-4 space-y-1 bg-slate-50/60">
                <BalanceRow
                  label="Previous Balance"
                  value={memberSummary.previousRolloverBalance}
                  icon={History}
                  color={memberSummary.previousRolloverBalance >= 0 ? "text-slate-600" : "text-rose-500"}
                  sign={memberSummary.previousRolloverBalance >= 0 ? "+" : "-"}
                />
                <BalanceRow
                  label="This Month's Earnings"
                  value={memberSummary.thisMonthEarnings}
                  icon={TrendingUp}
                  color="text-emerald-600"
                  sign="+"
                />
                <BalanceRow
                  label="Withdrawn This Month"
                  value={memberSummary.thisMonthPayouts}
                  icon={TrendingDown}
                  color="text-rose-500"
                  sign="-"
                />
                <div className="border-t border-slate-200 mt-2 pt-2">
                  <BalanceRow
                    label="Net Balance"
                    value={memberSummary.currentNetBalance}
                    icon={ArrowRight}
                    color={isPositive ? "text-emerald-700" : "text-rose-700"}
                    sign={isPositive ? "+" : "-"}
                  />
                </div>
              </div>

              {/* Property breakdown for this month */}
              {memberSummary.properties.length > 0 && (
                <div className="px-5 py-4 border-t border-slate-100">
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                    <Building2 size={13} /> This Month's Property Breakdown
                  </h5>
                  <div className="space-y-2">
                    {memberSummary.properties.map((property) => (
                      <div
                        key={property.propertyId}
                        className="flex justify-between items-center text-sm"
                      >
                        <span className="text-slate-500 font-medium">{property.propertyName}</span>
                        <span className="font-semibold text-emerald-700">
                          +{formatCurrency(property.shareAmount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

import type { PropertyDistributionResult } from "@/lib/finance/distributions";
import { formatCurrency } from "@/lib/finance/helpers";
import { Home } from "lucide-react";

interface PropertyDistributionTableProps {
  distributions: PropertyDistributionResult[];
}

export function PropertyDistributionTable({
  distributions,
}: PropertyDistributionTableProps) {
  if (distributions.length === 0) {
    return <p className="text-slate-500 text-center py-8">No property distributions found.</p>;
  }

  return (
    <section className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Home size={20} className="text-slate-500" />
          Property Breakdowns
        </h3>
      </div>
      <div className="p-0 overflow-x-auto">
        <div className="min-w-[600px]">
          <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-6 py-4 font-medium">Property</th>
              <th className="px-6 py-4 font-medium">Net Income</th>
              <th className="px-6 py-4 font-medium">Shareholder</th>
              <th className="px-6 py-4 font-medium text-right">Distributed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {distributions.map((distribution) => (
              <tr key={distribution.propertyId} className="hover:bg-slate-50/50 transition-colors align-top">
                <td className="px-6 py-5">
                  <span className="font-semibold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                    {distribution.propertyName}
                  </span>
                </td>
                <td className="px-6 py-5">
                  <span className={`font-semibold ${distribution.netIncome >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                    {formatCurrency(distribution.netIncome)}
                  </span>
                </td>
                <td colSpan={2} className="px-6 py-5">
                  {distribution.distributions.length === 0 ? (
                    <span className="text-slate-400 italic">No shareholders</span>
                  ) : (
                    <div className="space-y-3">
                      {distribution.distributions.map((member) => (
                        <div
                          key={member.memberId}
                          className="flex justify-between items-center gap-8"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-700">{member.memberName}</span>
                            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                              {(member.sharePercentage * 100).toFixed(0)}%
                            </span>
                          </div>
                          <span className="font-bold text-slate-800">
                            {formatCurrency(member.distributionAmount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </section>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getAllMemberPayouts,
  createMemberPayout,
  updateMemberPayout,
  deleteMemberPayout,
} from "@/lib/db/memberPayouts";
import { getAllFamilyMembers } from "@/lib/db/familyMembers";
import type { MemberPayout, FamilyMember } from "@/types";

const initialDate = new Date();
const initialForm: Omit<MemberPayout, "id" | "createdAt" | "updatedAt"> = {
  memberId: "",
  date: initialDate,
  monthKey: `${initialDate.getFullYear()}-${String(initialDate.getMonth() + 1).padStart(2, "0")}`,
  amount: 0,
  description: "",
};

export default function MemberPayoutsPage() {
  const [payouts, setPayouts] = useState<MemberPayout[]>([]);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    memberId: "",
    monthKey: "",
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [payoutData, memberData] = await Promise.all([
        getAllMemberPayouts(),
        getAllFamilyMembers(),
      ]);
      // Sort payouts by date descending
      payoutData.sort((a, b) => b.date.getTime() - a.date.getTime());
      setPayouts(payoutData);
      setMembers(memberData);
    } catch {
      setError("Failed to load member payouts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedMember = localStorage.getItem("lastPayoutMember");
    if (savedMember && !form.memberId) {
      setForm((prev) => ({ ...prev, memberId: savedMember }));
    }
    fetchData();
  }, []);

  const resetForm = () => {
    const savedMember = localStorage.getItem("lastPayoutMember") || "";
    const freshDate = new Date();
    setForm({ 
      ...initialForm, 
      memberId: savedMember,
      date: freshDate,
      monthKey: `${freshDate.getFullYear()}-${String(freshDate.getMonth() + 1).padStart(2, "0")}`
    });
    setEditId(null);
  };

  const generateMonthKey = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  };

  const handleDateChange = (dateString: string) => {
    const date = new Date(dateString);
    const monthKey = generateMonthKey(date);
    setForm({ ...form, date, monthKey });
  };

  const validateForm = () => {
    if (!form.memberId) {
      setError("Family member is required.");
      return false;
    }
    if (!form.date) {
      setError("Date is required.");
      return false;
    }
    if (!form.monthKey) {
      setError("Month key is required.");
      return false;
    }
    if (form.amount <= 0) {
      setError("Amount must be greater than 0.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setActionLoading(true);
    setError(null);

    try {
      if (editId) {
        await updateMemberPayout(editId, {
          memberId: form.memberId,
          date: form.date,
          monthKey: form.monthKey,
          amount: form.amount,
          description: form.description,
        });
      } else {
        await createMemberPayout({
          ...form,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
      await fetchData();
      resetForm();
    } catch {
      setError("Failed to save payout record.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = (payout: MemberPayout) => {
    setEditId(payout.id);
    setForm({
      memberId: payout.memberId,
      date: payout.date,
      monthKey: payout.monthKey,
      amount: payout.amount,
      description: payout.description ?? "",
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this payout record?")) return;

    setActionLoading(true);
    setError(null);
    try {
      await deleteMemberPayout(id);
      await fetchData();
    } catch {
      setError("Failed to delete payout record.");
    } finally {
      setActionLoading(false);
    }
  };

  const clearFilters = () => {
    setFilters({ memberId: "", monthKey: "" });
  };

  const filteredPayouts = useMemo(() => {
    return payouts.filter((payout) => {
      if (filters.memberId && payout.memberId !== filters.memberId) return false;
      if (filters.monthKey && payout.monthKey !== filters.monthKey) return false;
      return true;
    });
  }, [payouts, filters]);

  const summaryStats = useMemo(() => {
    const totalEntries = filteredPayouts.length;
    const totalAmount = filteredPayouts.reduce((sum, entry) => sum + entry.amount, 0);
    return { totalEntries, totalAmount };
  }, [filteredPayouts]);

  const getMemberName = (id: string) => members.find((m) => m.id === id)?.name ?? "Unknown";

  const uniqueMonths = useMemo(() => {
    const months = [...new Set(payouts.map((e) => e.monthKey))];
    return months.sort().reverse();
  }, [payouts]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 border-b pb-4 border-slate-200">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Member Payouts</h2>
          <p className="text-sm text-slate-500 mt-1">Record and track funds withdrawn by family members.</p>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border p-5 shadow-sm bg-white">
          <p className="text-sm font-medium text-slate-600">Total Payout Records</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{summaryStats.totalEntries}</p>
        </div>
        <div className="rounded-xl border p-5 shadow-sm bg-white">
          <p className="text-sm font-medium text-slate-600">Total Disbursed</p>
          <p className="mt-2 text-2xl font-semibold text-rose-600">
            {summaryStats.totalAmount.toLocaleString(undefined, { style: "currency", currency: "BDT" })}
          </p>
        </div>
      </div>

      {/* Filters */}
      <section className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Filter by Member</label>
            <select
              className="w-full rounded-lg border px-3 py-2.5 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              value={filters.memberId}
              onChange={(e) => setFilters({ ...filters, memberId: e.target.value })}
            >
              <option value="">All Family Members</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Filter by Month</label>
            <select
              className="w-full rounded-lg border px-3 py-2.5 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              value={filters.monthKey}
              onChange={(e) => setFilters({ ...filters, monthKey: e.target.value })}
            >
              <option value="">All Months</option>
              {uniqueMonths.map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={clearFilters}
            className="rounded-lg bg-slate-100 border border-slate-300 px-6 py-2.5 text-slate-700 hover:bg-slate-200 font-medium transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </section>

      {/* Form */}
      <section className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-xl font-semibold">{editId ? "Edit Payout Record" : "Record New Payout"}</h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 grid gap-6 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Family Member</label>
            <select
              className="w-full rounded-lg border px-3 py-2.5 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              value={form.memberId}
              onChange={(e) => {
                const memberId = e.target.value;
                setForm({ ...form, memberId });
                localStorage.setItem("lastPayoutMember", memberId);
              }}
              required
            >
              <option value="">Select Member</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Date of Transfer</label>
            <input
              type="date"
              className="w-full rounded-lg border px-3 py-2.5 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              value={form.date.toISOString().split("T")[0]}
              onChange={(e) => handleDateChange(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Amount Disbursed (BDT)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              className="w-full rounded-lg border px-3 py-2.5 focus:ring-blue-500 focus:border-blue-500 transition-colors font-medium text-rose-600"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Description / Memo (Optional)</label>
            <textarea
              className="w-full rounded-lg border px-3 py-2.5 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              placeholder="e.g. Bank Transfer, Cash Advance... "
            />
          </div>

          <div className="md:col-span-2 flex gap-3 pt-2">
            <button
              type="submit"
              disabled={actionLoading}
              className="rounded-lg bg-indigo-600 px-6 py-2.5 text-white hover:bg-indigo-700 font-medium disabled:opacity-50 transition-colors shadow-sm"
            >
              {actionLoading ? "Saving..." : editId ? "Update Payout" : "Record Payout"}
            </button>
            {editId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg bg-slate-100 border border-slate-300 px-6 py-2.5 text-slate-700 hover:bg-slate-200 font-medium transition-colors"
              >
                Cancel
              </button>
            )}
          </div>

          {error && <p className="md:col-span-2 text-sm text-rose-600 bg-rose-50 p-3 rounded-lg border border-rose-100">{error}</p>}
        </form>
      </section>

      {/* Table */}
      <section className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-xl font-semibold">Payout History</h3>
        </div>

        {loading ? (
          <p className="p-6 text-slate-500">Loading payout records...</p>
        ) : filteredPayouts.length === 0 ? (
          <p className="p-6 text-slate-500 text-center italic py-12">No payout records found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium">Month</th>
                  <th className="px-6 py-4 font-medium">Family Member</th>
                  <th className="px-6 py-4 font-medium">Memo</th>
                  <th className="px-6 py-4 font-medium text-right">Amount</th>
                  <th className="px-6 py-4 font-medium text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayouts.map((payout) => (
                  <tr key={payout.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 text-slate-600">{payout.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td className="px-6 py-4 text-slate-500">{payout.monthKey}</td>
                    <td className="px-6 py-4 font-semibold text-slate-800">{getMemberName(payout.memberId)}</td>
                    <td className="px-6 py-4 text-slate-500 truncate max-w-[200px]">{payout.description || "-"}</td>
                    <td className="px-6 py-4 font-bold text-rose-600 text-right">
                      -{payout.amount.toLocaleString(undefined, { style: "currency", currency: "BDT" })}
                    </td>
                    <td className="px-6 py-4 space-x-2 text-center">
                      <button
                        onClick={() => handleEdit(payout)}
                        className="rounded-md border border-slate-300 bg-white px-3 py-1 text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(payout.id)}
                        className="rounded-md border border-rose-200 bg-rose-50 px-3 py-1 text-rose-700 hover:bg-rose-100 transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

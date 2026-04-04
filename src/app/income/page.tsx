"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getAllIncomeEntries,
  createIncomeEntry,
  updateIncomeEntry,
  deleteIncomeEntry,
} from "@/lib/db/incomeEntries";
import { getAllProperties } from "@/lib/db/properties";
import type { IncomeEntry, Property } from "@/types";
import { Modal } from "@/components/ui/Modal";
import { Plus, ShieldAlert } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRole } from "@/hooks/useRole";
import { createNotification } from "@/lib/db/notifications";
import { toast } from "sonner";
import { format } from "date-fns";

const initialForm = {
  propertyId: "",
  date: new Date(),
  monthKey: new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0'),
  category: "Rent",
  description: "",
  amount: 0,
};

const incomeCategories = ["Rent", "Advance Adjustment", "Other Income"];

export default function IncomePage() {
  const [entries, setEntries] = useState<IncomeEntry[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { profile } = useAuth();
  const { isMember } = useRole();

  const getPropertyName = (id: string) => properties.find(p => p.id === id)?.name || "Unknown Property";
  const [filters, setFilters] = useState({
    propertyId: "",
    monthKey: "",
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [entryData, propertyData] = await Promise.all([
        getAllIncomeEntries(),
        getAllProperties(),
      ]);
      setEntries(entryData);
      setProperties(propertyData);
    } catch {
      setError("Failed to load income entries.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedCategory = localStorage.getItem("lastIncomeCategory");
    if (savedCategory && !form.category) {
      setForm((prev) => ({ ...prev, category: savedCategory }));
    }
    fetchData();
  }, []);

  const resetForm = () => {
    setForm(prev => ({ 
      ...initialForm, 
      propertyId: prev.propertyId, // 🏺 Remember Property
      date: prev.date,             // 📅 Remember Date
      monthKey: prev.monthKey,     // 🗓️ Remember Month
      category: prev.category      // 🏷️ Remember Category
    }));
    setEditId(null);
    setError(null);
    // 🚫 Do NOT close modal automatically (kept open for Power Entry)
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
    if (!form.propertyId) {
      setError("Property is required.");
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
    if (!form.category) {
      setError("Category is required.");
      return false;
    }
    if (form.amount <= 0) {
      setError("Amount must be greater than 0.");
      return false;
    }
    if (form.category === "Other Income" && (!form.description || form.description.trim() === "")) {
      setError("Please provide a note defining what the 'Other' income is.");
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
        await updateIncomeEntry(editId, {
          propertyId: form.propertyId,
          date: form.date,
          monthKey: form.monthKey,
          category: form.category,
          description: form.description,
          amount: form.amount,
        });
      } else {
        await createIncomeEntry({
          ...form,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        
        // Trigger notification
        if (profile) {
          const creatorName = profile.role === "super_admin" ? "System Administrator" : profile.displayName;
          await createNotification(
            `Added income: ${form.amount.toLocaleString(undefined, { style: "currency", currency: "BDT" })} for ${getPropertyName(form.propertyId)}`,
            "income",
            creatorName,
            form.propertyId,
            "/income"
          );
        }
      }
      toast.success(editId ? "Entry updated" : "Entry added");
      await fetchData();
      resetForm();
    } catch (error) {
      console.error("Save error:", error);
      setError("Failed to save entry.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = (entry: IncomeEntry) => {
    setEditId(entry.id);
    setForm({
      propertyId: entry.propertyId,
      date: entry.date,
      monthKey: entry.monthKey,
      category: entry.category,
      description: entry.description ?? "",
      amount: entry.amount,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this income entry?")) return;

    setActionLoading(true);
    setError(null);
    try {
      await deleteIncomeEntry(id);
      await fetchData();
    } catch {
      setError("Failed to delete income entry.");
    } finally {
      setActionLoading(false);
    }
  };

  const clearFilters = () => {
    setFilters({ propertyId: "", monthKey: "" });
  };

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      if (filters.propertyId && entry.propertyId !== filters.propertyId) return false;
      if (filters.monthKey && entry.monthKey !== filters.monthKey) return false;
      return true;
    });
  }, [entries, filters]);

  const summaryStats = useMemo(() => {
    const totalEntries = filteredEntries.length;
    const totalAmount = filteredEntries.reduce((sum, entry) => sum + entry.amount, 0);
    return { totalEntries, totalAmount };
  }, [filteredEntries]);

  const uniqueMonths = useMemo(() => {
    const months = [...new Set(entries.map((e) => e.monthKey))];
    return months.sort().reverse();
  }, [entries]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-4 border-slate-200 dark:border-slate-800/60">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Income</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Track rental income and other revenue.</p>
        </div>
        {isMember ? (
          <button 
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-white hover:bg-indigo-700 font-bold transition-all shadow-lg shadow-indigo-200"
          >
            <Plus size={20} />
            <span>Add Entry</span>
          </button>
        ) : (
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-xl border border-amber-100 text-xs font-bold">
             <ShieldAlert size={16} />
             <span>View Only Mode</span>
          </div>
        )}
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border p-5 shadow-sm bg-white dark:bg-slate-900">
          <p className="text-sm font-medium text-slate-600">Total Entries</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">{summaryStats.totalEntries}</p>
        </div>
        <div className="rounded-xl border p-5 shadow-sm bg-white dark:bg-slate-900">
          <p className="text-sm font-medium text-slate-600">Total Amount</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
            {summaryStats.totalAmount.toLocaleString(undefined, { style: "currency", currency: "BDT" })}
          </p>
        </div>
      </div>

      {/* Filters */}
      <section className="rounded-xl bg-white dark:bg-slate-900 p-6 shadow-sm border border-slate-200 dark:border-slate-800/60">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Filter by Property</label>
            <select
              className="w-full rounded-lg border px-3 py-2"
              value={filters.propertyId}
              onChange={(e) => setFilters({ ...filters, propertyId: e.target.value })}
            >
              <option value="">All Properties</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Filter by Month</label>
            <select
              className="w-full rounded-lg border px-3 py-2"
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
            className="rounded-lg bg-slate-300 px-4 py-2 text-slate-900 dark:text-slate-100 hover:bg-slate-400"
          >
            Clear Filters
          </button>
        </div>
      </section>

      {/* Entry Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editId ? "Edit Income Entry" : "Add Income Entry"}
      >
        <form onSubmit={handleSubmit} className="grid gap-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Property</label>
              <select
                className="w-full rounded-lg border px-3 py-2.5 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                value={form.propertyId}
                onChange={(e) => setForm({ ...form, propertyId: e.target.value })}
                required
              >
                <option value="">Select Property</option>
                {properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Date</label>
              <input
                type="date"
                className="w-full rounded-lg border px-3 py-2.5 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                value={form.date.toISOString().split("T")[0]}
                onChange={(e) => handleDateChange(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Category</label>
              <select
                className="w-full rounded-lg border px-3 py-2.5 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                value={form.category}
                onChange={(e) => {
                  const category = e.target.value;
                  setForm({ ...form, category });
                  localStorage.setItem("lastIncomeCategory", category);
                }}
                required
              >
                <option value="">Select Category</option>
                {incomeCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Amount (BDT)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                className="w-full rounded-lg border px-3 py-2.5 focus:ring-indigo-500 focus:border-indigo-500 transition-colors font-medium text-indigo-600"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                required
              />
            </div>
          </div>

          <div className={`transition-all duration-300 ${form.category === "Other Income" ? "p-4 bg-emerald-50 rounded-xl border border-emerald-200" : ""}`}>
            <label className={`block text-sm font-medium mb-1.5 ${form.category === "Other Income" ? "text-emerald-700" : "text-slate-700 dark:text-slate-300"}`}>
              {form.category === "Other Income" ? "Please define what this 'Other' income is *" : "Description (Optional)"}
            </label>
            <textarea
              className={`w-full rounded-lg border px-3 py-2.5 transition-all ${form.category === "Other Income" ? "border-emerald-300 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-slate-900" : "focus:ring-indigo-500 focus:border-indigo-500"}`}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={form.category === "Other Income" ? 2 : 3}
              required={form.category === "Other Income"}
              placeholder={form.category === "Other Income" ? "e.g. Sale of old furniture..." : "Any detail about this income..."}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={actionLoading}
              className="flex-1 rounded-xl bg-indigo-600 px-4 py-3 text-white hover:bg-indigo-700 font-bold disabled:opacity-50 transition-all shadow-md active:scale-95"
            >
              {actionLoading ? "Saving..." : editId ? "Update Entry" : "Create Entry"}
            </button>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800/60 px-4 py-3 text-slate-700 dark:text-slate-300 hover:bg-slate-200 font-bold transition-all"
            >
              Cancel
            </button>
          </div>

          {error && <p className="text-sm text-rose-600 bg-rose-50 p-3 rounded-lg border border-rose-100">{error}</p>}
        </form>
      </Modal>

      {/* Table */}
      <section className="rounded-xl bg-white dark:bg-slate-900 p-6 shadow-sm border border-slate-200 dark:border-slate-800/60">
        <h3 className="text-xl font-semibold mb-4">Income Entries</h3>

        {loading ? (
          <p>Loading entries...</p>
        ) : filteredEntries.length === 0 ? (
          <p>No income entries found.</p>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-slate-200 dark:border-slate-800/60 text-slate-700 dark:text-slate-300">
                    <tr>
                      <th className="px-6 py-4 text-left">Date</th>
                      <th className="px-6 py-4 text-left">Property</th>
                      <th className="px-6 py-4 text-left">Category</th>
                      <th className="px-6 py-4 text-right">Amount</th>
                      {isMember && <th className="px-6 py-4 text-right pr-10">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {filteredEntries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-slate-50 dark:bg-slate-900/50 transition-colors">
                        <td className="px-6 py-4 font-medium">{format(entry.date, 'MMM d, yyyy')}</td>
                        <td className="px-6 py-4">{getPropertyName(entry.propertyId)}</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 uppercase">
                            {entry.category}
                          </span>
                          {entry.description && (
                            <span className="ml-2 text-xs text-slate-500 dark:text-slate-400 italic">
                               ({entry.description})
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-emerald-600">
                          {entry.amount.toLocaleString(undefined, { style: "currency", currency: "BDT" })}
                        </td>
                        {isMember && (
                          <td className="px-6 py-4 text-right pr-10 space-x-2">
                            <button
                              onClick={() => handleEdit(entry)}
                              className="rounded-md border border-indigo-200 bg-indigo-50 px-2 py-1 text-indigo-700 hover:bg-indigo-100 transition-colors text-xs font-bold"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(entry.id)}
                              className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-rose-700 hover:bg-rose-100 transition-colors text-xs font-bold"
                            >
                              Delete
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
            </table>
          </div>
        </div>
        )}
      </section>
    </div>
  );
}
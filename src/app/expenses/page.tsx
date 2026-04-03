"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getAllExpenseEntries,
  createExpenseEntry,
  updateExpenseEntry,
  deleteExpenseEntry,
} from "@/lib/db/expenseEntries";
import { getAllProperties } from "@/lib/db/properties";
import type { ExpenseEntry, Property } from "@/types";
import { Modal } from "@/components/ui/Modal";
import { Plus, ShieldAlert } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRole } from "@/hooks/useRole";
import { createNotification } from "@/lib/db/notifications";
import { toast } from "sonner";
import { format } from "date-fns";

const initialDate = new Date();
const initialForm: Omit<ExpenseEntry, "id" | "createdAt" | "updatedAt"> = {
  propertyId: "",
  date: initialDate,
  monthKey: `${initialDate.getFullYear()}-${String(initialDate.getMonth() + 1).padStart(2, "0")}`,
  category: "",
  description: "",
  amount: 0,
};

const expenseCategories = ["Maintenance", "Utility", "Tax", "Staff", "Other Expense"];

export default function ExpensesPage() {
  const [entries, setEntries] = useState<ExpenseEntry[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { profile } = useAuth();
  const { isMember } = useRole();

  const getPropertyName = (id: string) => {
    if (id === "other") return "Other Property/Expenses";
    return properties.find(p => p.id === id)?.name || "Unknown Property";
  };
  const [filters, setFilters] = useState({
    propertyId: "",
    monthKey: "",
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [entryData, propertyData] = await Promise.all([
        getAllExpenseEntries(),
        getAllProperties(),
      ]);
      setEntries(entryData);
      setProperties(propertyData);
    } catch {
      setError("Failed to load expense entries.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedCategory = localStorage.getItem("lastExpenseCategory");
    if (savedCategory && !form.category) {
      setForm((prev) => ({ ...prev, category: savedCategory }));
    }
    fetchData();
  }, []);

  const resetForm = () => {
    setForm(prev => ({ 
      ...initialForm, 
      propertyId: prev.propertyId, // 🏺 Remember Property
      category: prev.category,    // 🏷️ Remember Category
      date: prev.date,            // 📅 Remember Date
      monthKey: prev.monthKey     // 🗓️ Remember Month
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
    if ((form.category === "Other Expense" || form.category === "Utility") && (!form.description || form.description.trim() === "")) {
      setError(`Please provide a note defining what the ${form.category === "Utility" ? "Utility" : "Other"} expense is.`);
      return false;
    }
    if (form.propertyId === "other" && (!form.description || form.description.trim() === "")) {
      setError("Please provide a note defining what the 'Other' property context is.");
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
        await updateExpenseEntry(editId, {
          propertyId: form.propertyId,
          date: form.date,
          monthKey: form.monthKey,
          category: form.category,
          description: form.description,
          amount: form.amount,
        });
      } else {
        await createExpenseEntry({
          ...form,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        // Trigger notification
        if (profile) {
          const creatorName = profile.role === "super_admin" ? "System Administrator" : profile.displayName;
          await createNotification(
            `Added expense: ${form.amount.toLocaleString(undefined, { style: "currency", currency: "BDT" })} for ${getPropertyName(form.propertyId)}`,
            "expense",
            creatorName,
            form.propertyId,
            "/expenses"
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

  const handleEdit = (entry: ExpenseEntry) => {
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
    if (!confirm("Delete this expense entry?")) return;

    setActionLoading(true);
    setError(null);
    try {
      await deleteExpenseEntry(id);
      await fetchData();
    } catch {
      setError("Failed to delete expense entry.");
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
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-4 border-slate-200">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Expenses</h2>
          <p className="text-sm text-slate-500 mt-1">Track operational costs and expenses.</p>
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
        <div className="rounded-xl border p-5 shadow-sm bg-white">
          <p className="text-sm font-medium text-slate-600">Total Entries</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{summaryStats.totalEntries}</p>
        </div>
        <div className="rounded-xl border p-5 shadow-sm bg-white">
          <p className="text-sm font-medium text-slate-600">Total Amount</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {summaryStats.totalAmount.toLocaleString(undefined, { style: "currency", currency: "BDT" })}
          </p>
        </div>
      </div>

      {/* Filters */}
      <section className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">Filter by Property</label>
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
            <label className="block text-sm font-medium text-slate-700 mb-1">Filter by Month</label>
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
            className="rounded-lg bg-slate-300 px-4 py-2 text-slate-900 hover:bg-slate-400"
          >
            Clear Filters
          </button>
        </div>
      </section>

      {/* Entry Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editId ? "Edit Expense Entry" : "Add Expense Entry"}
      >
        <form onSubmit={handleSubmit} className="grid gap-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Property</label>
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
                <option value="other">Other Property/Expenses</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Date</label>
              <input
                type="date"
                className="w-full rounded-lg border px-3 py-2.5 focus:ring-indigo-500 focus:border-indigo-500 transition-colors font-sans"
                value={form.date.toISOString().split("T")[0]}
                onChange={(e) => handleDateChange(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
              <select
                className="w-full rounded-lg border px-3 py-2.5 focus:ring-indigo-500 focus:border-indigo-500 transition-colors shadow-sm"
                value={form.category}
                onChange={(e) => {
                  const category = e.target.value;
                  setForm({ ...form, category });
                  localStorage.setItem("lastExpenseCategory", category);
                }}
                required
              >
                <option value="">Select Category</option>
                {expenseCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Amount (BDT)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                className="w-full rounded-lg border px-3 py-2.5 focus:ring-indigo-500 focus:border-indigo-500 transition-colors font-black text-rose-600"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                required
              />
            </div>
          </div>

          {/* Dynamic Note Box for "Other" or "Utility" Selections */}
          {(form.category === "Other Expense" || form.propertyId === "other" || form.category === "Utility") && (
            <div className={`p-4 bg-rose-50 rounded-2xl border border-rose-200 animate-in slide-in-from-top-2 duration-300`}>
              <label className={`block text-xs font-black uppercase tracking-widest mb-2 text-rose-700`}>
                {form.category === "Utility" ? "Define Utility (Gas, Electric, Water, etc.) *" : `Define "${form.propertyId === "other" ? "Other Property" : "Other Expense"}" *`}
              </label>
              <textarea
                className={`w-full rounded-xl border border-rose-300 px-4 py-3 focus:ring-rose-500 focus:border-rose-500 bg-white min-h-[100px] outline-none transition-all`}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
                placeholder={
                  form.category === "Utility" ? "e.g. Electric bill, Gas refill..." :
                  form.propertyId === "other" ? "e.g. Community hall, Garage space..." : 
                  "e.g. Broken window repair, Event catering..."
                }
              />
            </div>
          )}

          {/* Optional description for non-special categories */}
          {form.category !== "Other Expense" && form.propertyId !== "other" && form.category !== "Utility" && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Note (Optional)</label>
              <textarea
                className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                placeholder="Any detail about this expense..."
              />
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              type="submit"
              disabled={actionLoading}
              className="flex-1 rounded-[1.5rem] bg-indigo-600 px-6 py-4 text-white hover:bg-slate-900 font-black transition-all shadow-xl shadow-indigo-100 disabled:opacity-50 active:scale-95"
            >
              {actionLoading ? "Saving..." : editId ? "Save Changes" : "Create Entry"}
            </button>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 rounded-[1.5rem] bg-white border border-slate-200 px-6 py-4 text-slate-500 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100 font-bold transition-all"
            >
              Cancel
            </button>
          </div>

          {error && <p className="text-sm text-rose-600 bg-rose-50 p-3 rounded-lg border border-rose-100">{error}</p>}
        </form>
      </Modal>

      {/* Table */}
      <section className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
        <h3 className="text-xl font-semibold mb-4">Expense Entries</h3>

        {loading ? (
          <p>Loading entries...</p>
        ) : filteredEntries.length === 0 ? (
          <p>No expense entries found.</p>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-slate-200 text-slate-700">
                    <tr>
                      <th className="px-6 py-4 text-left">Date</th>
                      <th className="px-6 py-4 text-left">Property</th>
                      <th className="px-6 py-4 text-left">Category</th>
                      <th className="px-6 py-4 text-right">Amount</th>
                      {isMember && <th className="px-6 py-4 text-right pr-10">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredEntries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-medium">{format(entry.date, 'MMM d, yyyy')}</td>
                        <td className="px-6 py-4">{getPropertyName(entry.propertyId)}</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 rounded-md bg-slate-100 text-[10px] font-bold text-slate-600 uppercase">
                            {entry.category}
                          </span>
                          {entry.description && (
                            <span className="ml-2 text-xs text-slate-500 italic">
                               ({entry.description})
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-rose-600">
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
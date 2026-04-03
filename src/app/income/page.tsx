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

const initialDate = new Date();
const initialForm: Omit<IncomeEntry, "id" | "createdAt" | "updatedAt"> = {
  propertyId: "",
  date: initialDate,
  monthKey: `${initialDate.getFullYear()}-${String(initialDate.getMonth() + 1).padStart(2, "0")}`,
  category: "",
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
    const savedCategory = localStorage.getItem("lastIncomeCategory") || "";
    const freshDate = new Date();
    setForm({ 
      ...initialForm, 
      category: savedCategory,
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
      }
      await fetchData();
      resetForm();
    } catch {
      setError("Failed to save income entry.");
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

  const getPropertyName = (id: string) => properties.find((p) => p.id === id)?.name ?? "Unknown";

  const uniqueMonths = useMemo(() => {
    const months = [...new Set(entries.map((e) => e.monthKey))];
    return months.sort().reverse();
  }, [entries]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <h2 className="text-3xl font-bold">Income</h2>
        <p className="text-sm text-slate-600">Track rental income and other revenue.</p>
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

      {/* Form */}
      <section className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
        <h3 className="text-xl font-semibold mb-4">{editId ? "Edit Income Entry" : "Add Income Entry"}</h3>

        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Property</label>
            <select
              className="w-full rounded-lg border px-3 py-2"
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
            <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
            <input
              type="date"
              className="w-full rounded-lg border px-3 py-2"
              value={form.date.toISOString().split("T")[0]}
              onChange={(e) => handleDateChange(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
            <select
              className="w-full rounded-lg border px-3 py-2"
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
            <label className="block text-sm font-medium text-slate-700 mb-1">Amount</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              className="w-full rounded-lg border px-3 py-2"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
              required
            />
          </div>

          <div className={`md:col-span-2 transition-all duration-300 ${form.category === "Other Income" ? "p-4 bg-emerald-50 rounded-xl border border-emerald-200" : ""}`}>
            <label className={`block text-sm font-medium mb-1 ${form.category === "Other Income" ? "text-emerald-700" : "text-slate-700"}`}>
              {form.category === "Other Income" ? "Please define what this 'Other' income is *" : "Description (Optional)"}
            </label>
            <textarea
              className={`w-full rounded-lg border px-3 py-2 ${form.category === "Other Income" ? "border-emerald-300 focus:ring-emerald-500 focus:border-emerald-500 bg-white" : ""}`}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={form.category === "Other Income" ? 2 : 3}
              required={form.category === "Other Income"}
              placeholder={form.category === "Other Income" ? "e.g. Sale of old furniture..." : ""}
            />
          </div>

          <div className="md:col-span-2 flex gap-2">
            <button
              type="submit"
              disabled={actionLoading}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {actionLoading ? "Saving..." : editId ? "Update Entry" : "Create Entry"}
            </button>
            {editId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg bg-slate-300 px-4 py-2 text-slate-900"
              >
                Cancel
              </button>
            )}
          </div>

          {error && <p className="md:col-span-2 text-sm text-rose-600">{error}</p>}
        </form>
      </section>

      {/* Table */}
      <section className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
        <h3 className="text-xl font-semibold mb-4">Income Entries</h3>

        {loading ? (
          <p>Loading entries...</p>
        ) : filteredEntries.length === 0 ? (
          <p>No income entries found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-700">
                <tr>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Month</th>
                  <th className="px-3 py-2">Property</th>
                  <th className="px-3 py-2">Category</th>
                  <th className="px-3 py-2">Description</th>
                  <th className="px-3 py-2">Amount</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry) => (
                  <tr key={entry.id} className="border-b last:border-b-0">
                    <td className="px-3 py-2">{entry.date.toLocaleDateString()}</td>
                    <td className="px-3 py-2">{entry.monthKey}</td>
                    <td className="px-3 py-2">{getPropertyName(entry.propertyId)}</td>
                    <td className="px-3 py-2">{entry.category}</td>
                    <td className="px-3 py-2">{entry.description || "-"}</td>
                    <td className="px-3 py-2">{entry.amount.toLocaleString(undefined, { style: "currency", currency: "BDT" })}</td>
                    <td className="px-3 py-2 space-x-2">
                      <button
                        onClick={() => handleEdit(entry)}
                        className="rounded-md border border-blue-500 px-2 py-1 text-blue-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="rounded-md border border-rose-500 px-2 py-1 text-rose-600"
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
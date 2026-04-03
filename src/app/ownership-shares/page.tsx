"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getAllOwnershipShares,
  createOwnershipShare,
  updateOwnershipShare,
  deleteOwnershipShare,
} from "@/lib/db/ownershipShares";
import { getAllProperties } from "@/lib/db/properties";
import { getAllFamilyMembers } from "@/lib/db/familyMembers";
import type { OwnershipShare, Property, FamilyMember } from "@/types";

const initialForm: Omit<OwnershipShare, "id" | "createdAt" | "updatedAt"> = {
  propertyId: "",
  memberId: "",
  percentage: 0,
};

export default function OwnershipSharesPage() {
  const [shares, setShares] = useState<OwnershipShare[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm);
  const [editId, setEditId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [shareData, propertyData, memberData] = await Promise.all([
        getAllOwnershipShares(),
        getAllProperties(),
        getAllFamilyMembers(),
      ]);
      setShares(shareData);
      setProperties(propertyData);
      setMembers(memberData);
    } catch {
      setError("Failed to load ownership shares.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setForm(initialForm);
    setEditId(null);
  };

  const validatePercentage = (value: number, propertyId: string) => {
    if (value <= 0 || value > 100) {
      setError("Percentage must be > 0 and <= 100.");
      return false;
    }

    const currentTotal = shares
      .filter((s) => s.propertyId === propertyId && s.id !== editId)
      .reduce((sum, s) => sum + s.percentage, 0);
      
    if (currentTotal + value > 100) {
      setError(`Total percentage cannot exceed 100%. Current allocated: ${currentTotal}%. You can only add up to ${100 - currentTotal}%.`);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.propertyId || !form.memberId) {
      setError("Property and family member are required.");
      return;
    }

    const existingMemberShare = shares.find(s => s.propertyId === form.propertyId && s.memberId === form.memberId && s.id !== editId);
    if (existingMemberShare) {
      setError("This family member already has a share in this property. Please edit their existing share instead.");
      return;
    }

    if (!validatePercentage(form.percentage, form.propertyId)) return;

    setActionLoading(true);
    setError(null);

    try {
      if (editId) {
        await updateOwnershipShare(editId, {
          propertyId: form.propertyId,
          memberId: form.memberId,
          percentage: form.percentage,
        });
      } else {
        await createOwnershipShare({
          ...form,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
      await fetchData();
      resetForm();
    } catch (error) {
      console.error("Save ownership error:", error);
      setError(`Failed to save ownership share: ${error instanceof Error ? error.message : "Unknown"}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = (share: OwnershipShare) => {
    setEditId(share.id);
    setForm({
      propertyId: share.propertyId,
      memberId: share.memberId,
      percentage: share.percentage,
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this ownership share?")) return;

    setActionLoading(true);
    setError(null);
    try {
      await deleteOwnershipShare(id);
      await fetchData();
    } catch {
      setError("Failed to delete ownership share.");
    } finally {
      setActionLoading(false);
    }
  };

  const sharesByProperty = useMemo(() => {
    return shares.reduce<Record<string, OwnershipShare[]>>((acc, share) => {
      if (!acc[share.propertyId]) acc[share.propertyId] = [];
      acc[share.propertyId].push(share);
      return acc;
    }, {});
  }, [shares]);

  const totalByProperty = useMemo(() => {
    return Object.fromEntries(
      Object.entries(sharesByProperty).map(([propertyId, propertyShares]) => {
        const total = propertyShares.reduce((acc, s) => acc + s.percentage, 0);
        return [propertyId, total];
      }),
    );
  }, [sharesByProperty]);

  const getPropertyName = (id: string) => properties.find((p) => p.id === id)?.name ?? "Unknown";
  const getMemberName = (id: string) => members.find((m) => m.id === id)?.name ?? "Unknown";

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <h2 className="text-3xl font-bold">Ownership Shares</h2>
        <p className="text-sm text-slate-600">Manage ownership shares by property and member.</p>
      </header>

      <section className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
        <h3 className="text-xl font-semibold mb-4">{editId ? "Edit Ownership Share" : "Add Ownership Share"}</h3>

        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-3">
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
            <label className="block text-sm font-medium text-slate-700 mb-1">Family Member</label>
            <select
              className="w-full rounded-lg border px-3 py-2"
              value={form.memberId}
              onChange={(e) => setForm({ ...form, memberId: e.target.value })}
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
            <label className="block text-sm font-medium text-slate-700 mb-1">Percentage</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max="100"
              className="w-full rounded-lg border px-3 py-2"
              value={form.percentage}
              onChange={(e) => setForm({ ...form, percentage: Number(e.target.value) })}
              required
            />
          </div>

          <div className="md:col-span-3 flex gap-2">
            <button
              type="submit"
              disabled={actionLoading}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {actionLoading ? "Saving..." : editId ? "Update Share" : "Create Share"}
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

          {error && <p className="md:col-span-3 text-sm text-rose-600">{error}</p>}
        </form>
      </section>

      <section className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
        <h3 className="text-xl font-semibold mb-4">Ownership Shares</h3>

        {loading ? (
          <p>Loading shares...</p>
        ) : shares.length === 0 ? (
          <p>No ownership shares found.</p>
        ) : (
          <div className="space-y-6">
            {Object.entries(sharesByProperty).map(([propertyId, propertyShares]) => {
              const total = totalByProperty[propertyId] ?? 0;
              return (
                <div key={propertyId} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{getPropertyName(propertyId)}</h4>
                    <span className="text-xs font-semibold text-slate-600">
                      Total: {total.toFixed(2)}%
                    </span>
                  </div>

                  {total !== 100 && (
                    <p className="mb-2 text-xs text-amber-700 bg-amber-100 p-2 rounded">Total ownership for this property is {total.toFixed(2)}%, not 100%.</p>
                  )}

                  <div className="overflow-x-auto">
                    <div className="min-w-[500px]">
                      <table className="min-w-full text-left text-sm">
                        <thead className="border-b border-slate-200 text-slate-700">
                          <tr>
                            <th className="px-3 py-2 text-slate-500 font-medium whitespace-nowrap">Family Member</th>
                            <th className="px-3 py-2 text-slate-500 font-medium whitespace-nowrap text-right">Percentage</th>
                            <th className="px-3 py-2 text-slate-500 font-medium whitespace-nowrap text-right pr-6">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {propertyShares.map((share) => (
                            <tr key={share.id} className="border-b last:border-b-0 hover:bg-slate-50 transition-colors">
                              <td className="px-3 py-3 font-semibold text-slate-700">{getMemberName(share.memberId)}</td>
                              <td className="px-3 py-3 font-bold text-indigo-600 text-right">{share.percentage.toFixed(2)}%</td>
                              <td className="px-3 py-3 text-right pr-6 space-x-2">
                                <button
                                  onClick={() => handleEdit(share)}
                                  className="rounded-md border border-indigo-200 bg-indigo-50 px-3 py-1 text-indigo-700 hover:bg-indigo-100 transition-colors text-xs font-bold"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDelete(share.id)}
                                  className="rounded-md border border-rose-200 bg-rose-50 px-3 py-1 text-rose-700 hover:bg-rose-100 transition-colors text-xs font-bold"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

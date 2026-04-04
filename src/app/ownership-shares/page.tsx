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
import { calculateShariahPercentages } from "@/lib/utils/shariah";
import type { OwnershipShare, Property, FamilyMember } from "@/types";
import { Modal } from "@/components/ui/Modal";
import { formatCurrency, round2 } from "@/lib/finance/helpers";
import { Plus, ShieldAlert, Scale } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRole } from "@/hooks/useRole";
import { createNotification } from "@/lib/db/notifications";
import { toast } from "sonner";

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { profile } = useAuth();
  const { isMember } = useRole();

  const getPropertyName = (id: string) => properties.find((p) => p.id === id)?.name ?? "Unknown Property";
  const getMemberName = (id: string) => members.find((m) => m.id === id)?.name ?? "Unknown Member";

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
    setIsModalOpen(false);
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

        // Trigger notification
        if (profile) {
          const creatorName = profile.role === "super_admin" ? "System Administrator" : profile.displayName;
          await createNotification(
            `Added share: ${form.percentage}% for ${getMemberName(form.memberId)} in ${getPropertyName(form.propertyId)}`,
            "share",
            creatorName,
            undefined,
            "/ownership-shares"
          );
        }
      }
      toast.success(editId ? "Share updated" : "Share created");
      await fetchData();
      resetForm();
    } catch (error) {
      console.error("Save error:", error);
      setError("Failed to save ownership share.");
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
    setIsModalOpen(true);
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

  const handleShariahDistribution = async (propertyId: string) => {
    const propertyShares = sharesByProperty[propertyId] || [];
    if (!confirm("This will redistribute all current shares for this property based on the Islamic 2:1 son-to-daughter/mother rule. Continue?")) return;

    setActionLoading(true);
    try {
      const rebalanced = calculateShariahPercentages(propertyShares, members);

      if (rebalanced.length === 0) {
        toast.error("No valid members found for distribution.");
        return;
      }

      // 2. Redistribute
      await Promise.all(rebalanced.map(item => 
        updateOwnershipShare(item.id, { 
          percentage: item.percentage,
          updatedAt: new Date()
        } as any)
      ));

      toast.success("Shariah distribution applied successfully!");
      fetchData();
    } catch (err) {
      console.error("Error distributing shares:", err);
      toast.error("Failed to apply Shariah distribution.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-4 border-slate-200 dark:border-slate-800/60">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Ownership Shares</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage ownership shares by property and member.</p>
        </div>
        {isMember ? (
          <button 
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-white hover:bg-indigo-700 font-bold transition-all shadow-lg shadow-indigo-200"
          >
            <Plus size={20} />
            <span>Add Share</span>
          </button>
        ) : (
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-xl border border-amber-100 text-xs font-bold">
             <ShieldAlert size={16} />
             <span>View Only Mode</span>
          </div>
        )}
      </header>

      {/* Share Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editId ? "Edit Ownership Share" : "Add Ownership Share"}
      >
        <form onSubmit={handleSubmit} className="grid gap-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Property</label>
              <select
                className="w-full rounded-lg border px-3 py-2.5 bg-white dark:bg-slate-900 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
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
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Family Member</label>
              <select
                className="w-full rounded-lg border px-3 py-2.5 bg-white dark:bg-slate-900 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
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

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Percentage Share (%)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max="100"
                className="w-full rounded-lg border px-3 py-2.5 focus:ring-indigo-500 focus:border-indigo-500 transition-colors font-bold text-indigo-600"
                value={form.percentage}
                onChange={(e) => setForm({ ...form, percentage: Number(e.target.value) })}
                required
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={actionLoading}
              className="flex-1 rounded-xl bg-indigo-600 px-4 py-3 text-white hover:bg-indigo-700 font-bold disabled:opacity-50 transition-all shadow-md active:scale-95"
            >
              {actionLoading ? "Saving..." : editId ? "Update Share" : "Create Share"}
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

      <section className="rounded-xl bg-white dark:bg-slate-900 p-6 shadow-sm border border-slate-200 dark:border-slate-800/60">
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
                <div key={propertyId} className="rounded-3xl border border-slate-200 dark:border-slate-800/60 p-6 bg-slate-50/50 hover:bg-white dark:bg-slate-900 hover:shadow-2xl hover:shadow-slate-200 transition-all group/prop">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                       <h4 className="text-xl font-black text-slate-900 dark:text-slate-100 font-heading tracking-tight">{getPropertyName(propertyId)}</h4>
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Property Ledger</span>
                    </div>
                    <div className="flex items-center gap-3">
                       <span className={`text-xs font-black px-4 py-2 rounded-xl ${total === 100 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                         Total Allocation: {total.toFixed(2)}%
                       </span>
                       {isMember && (
                          <button
                            onClick={() => handleShariahDistribution(propertyId)}
                            className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-[0.15em] hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 hover:shadow-indigo-100 active:scale-95"
                            title="Distribute by Islamic Rule (2:1 Male:Female)"
                          >
                            <Scale size={14} />
                            Shariah Rule
                          </button>
                       )}
                    </div>
                  </div>

                  {total !== 100 && (
                    <div className="mb-6 flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100/50 text-amber-700">
                       <ShieldAlert size={18} />
                       <p className="text-xs font-bold font-heading">The total ownership for this property is currently {total.toFixed(2)}%. It must reach 100% for accurate distribution.</p>
                    </div>
                  )}

                  <div className="overflow-x-auto">
                    <div className="min-w-[500px]">
                      <table className="min-w-full text-left text-sm">
                        <thead className="border-b border-slate-200 dark:border-slate-800/60 text-slate-700 dark:text-slate-300">
                          <tr>
                            <th className="px-3 py-2 text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">Family Member</th>
                            <th className="px-3 py-2 text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap text-right">Percentage</th>
                            <th className="px-3 py-2 text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap text-right pr-6">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {propertyShares.map((share) => (
                            <tr key={share.id} className="border-b last:border-b-0 hover:bg-slate-50 dark:bg-slate-900/50 transition-colors">
                              <td className="px-3 py-3 font-semibold text-slate-700 dark:text-slate-300">{getMemberName(share.memberId)}</td>
                              <td className="px-3 py-3 font-bold text-indigo-600 text-right">{share.percentage.toFixed(2)}%</td>
                              {isMember && (
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
                              )}
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

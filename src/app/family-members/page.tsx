"use client";

import { useEffect, useState } from "react";
import {
  getAllFamilyMembers,
  createFamilyMember,
  updateFamilyMember,
  deleteFamilyMember,
} from "@/lib/db/familyMembers";
import type { FamilyMember } from "@/types";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/context/AuthContext";
import { useRole } from "@/hooks/useRole";
import { createNotification } from "@/lib/db/notifications";
import { toast } from "sonner";
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Check, 
  Shield, 
  Users,
  ShieldCheck, 
  Eye, 
  Clock,
  Link as LinkIcon,
  ShieldAlert
} from "lucide-react";

const initialForm = {
  name: "",
  relation: "son" as "son" | "daughter" | "mother" | "other",
  isActive: true,
};
export default function FamilyMembersPage() {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    relation: "son" as "son" | "daughter" | "mother" | "other",
    isActive: true,
  });
  const [editId, setEditId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { profile } = useAuth();
  const { isMember } = useRole();

  const fetchMembers = async () => {
    setLoading(true);
    setError(null);
    try {
      setMembers(await getAllFamilyMembers());
    } catch {
      setError("Failed to load family members.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const resetForm = () => {
    setForm({ name: "", relation: "son", isActive: true });
    setEditId(null);
    setIsModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name) {
      setError("Name is required.");
      return;
    }

    setActionLoading(true);
    setError(null);

    try {
      if (editId) {
        await updateFamilyMember(editId, {
          name: form.name,
          relation: form.relation,
          gender: form.relation === 'son' ? 'male' : 'female',
          isActive: form.isActive,
        });
      } else {
        await createFamilyMember({
          ...form,
          gender: form.relation === 'son' ? 'male' : 'female',
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        // Trigger notification
        if (profile) {
          const creatorName = profile.role === "super_admin" ? "System Administrator" : profile.displayName;
          await createNotification(
            `Added family member: ${form.name}`,
            "member",
            creatorName,
            undefined,
            "/family-members"
          );
        }
      }
      toast.success(editId ? "Member updated" : "Member added");
      await fetchMembers();
      resetForm();
    } catch (error) {
      console.error("Save error:", error);
      setError("Failed to save family member.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = (member: FamilyMember) => {
    setEditId(member.id);
    setForm({
      name: member.name,
      relation: member.relation || "son",
      isActive: member.isActive,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this family member?")) return;

    setActionLoading(true);
    setError(null);
    try {
      await deleteFamilyMember(id);
      await fetchMembers();
    } catch {
      setError("Failed to delete family member.");
    } finally {
      setActionLoading(false);
    }
  };

  const statusClass = (active: boolean) =>
    active ? "text-emerald-700 bg-emerald-100" : "text-rose-700 bg-rose-100";

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-4 border-slate-200 dark:border-slate-800/60">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Family Members</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage family members.</p>
        </div>
        {isMember ? (
          <button 
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-white hover:bg-indigo-700 font-bold transition-all shadow-lg shadow-indigo-200"
          >
            <Plus size={20} />
            <span>Add Member</span>
          </button>
        ) : (
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-xl border border-amber-100 text-xs font-bold">
             <ShieldAlert size={16} />
             <span>View Only Mode</span>
          </div>
        )}
      </header>

      {/* Member Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editId ? "Edit Family Member" : "Add Family Member"}
      >
        <form onSubmit={handleSubmit} className="grid gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Full Name</label>
            <input
              className="w-full rounded-lg border px-3 py-2.5 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              placeholder="e.g. John Doe"
            />
          </div>

          <div>
             <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Family Relation *</label>
             <select
               className="w-full rounded-xl border border-slate-200 dark:border-slate-800/60 px-4 py-3 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
               value={form.relation}
               onChange={(e) => setForm({ ...form, relation: e.target.value as any })}
               required
             >
               <option value="son">Son (Inherit 2.0x)</option>
               <option value="daughter">Daughter (Inherit 1.0x)</option>
               <option value="mother">Mother (Inherit 1.0x)</option>
               <option value="other">Other / Staff</option>
             </select>
          </div>

          <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800/40">
            <input
              type="checkbox"
              id="isMemberActive"
              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
            <label htmlFor="isMemberActive" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">Member is currently Active</label>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={actionLoading}
              className="flex-1 rounded-xl bg-indigo-600 px-4 py-3 text-white hover:bg-indigo-700 font-bold disabled:opacity-50 transition-all shadow-md active:scale-95"
            >
              {actionLoading ? "Saving..." : editId ? "Update Member" : "Create Member"}
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
        <h3 className="text-xl font-semibold mb-4">Family Members</h3>

        {loading ? (
          <p>Loading members...</p>
        ) : members.length === 0 ? (
          <p>No family members found.</p>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[400px]">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-200 dark:border-slate-800/60 text-slate-700 dark:text-slate-300">
                  <tr>
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={member.id} className="border-b last:border-b-0 group">
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-slate-50 dark:bg-slate-900/50 group-hover:bg-indigo-50 rounded-2xl transition-all">
                            {member.relation === 'son' ? <span className="text-xl">👦</span> : 
                             member.relation === 'daughter' ? <span className="text-xl">👧</span> : 
                             member.relation === 'mother' ? <span className="text-xl">🧕</span> : 
                             <Users className="text-indigo-600" size={24} />}
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 transition-colors">{member.name}</h3>
                            <div className="flex items-center gap-2 mt-0.5">
                               <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                 member.relation === 'son' ? 'bg-indigo-100 text-indigo-700' :
                                 member.relation === 'daughter' ? 'bg-rose-100 text-rose-700' :
                                 member.relation === 'mother' ? 'bg-emerald-100 text-emerald-700' :
                                 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                               }`}>
                                 {member.relation || 'Member'}
                               </span>
                               {member.linkedUid && (
                                 <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest">
                                   Registered
                                 </span>
                               )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                         <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${member.gender === 'female' ? 'bg-pink-50 text-pink-600' : 'bg-indigo-50 text-indigo-600'}`}>
                            {member.gender === 'female' ? 'Girl' : 'Boy'}
                         </span>
                      </td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${statusClass(member.isActive)}`}>
                          {member.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      {isMember && (
                        <td className="px-3 py-2 text-right space-x-2">
                          <button
                            onClick={() => handleEdit(member)}
                            className="rounded-md border border-indigo-200 bg-indigo-50 px-3 py-1 text-indigo-700 hover:bg-indigo-100 transition-colors text-xs font-bold"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(member.id)}
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
        )}
      </section>
    </div>
  );
}

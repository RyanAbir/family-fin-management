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
import { Plus } from "lucide-react";

const initialForm: Omit<FamilyMember, "id" | "createdAt" | "updatedAt"> = {
  name: "",
  isActive: true,
};

export default function FamilyMembersPage() {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
    setForm(initialForm);
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
          isActive: form.isActive,
        });
      } else {
        await createFamilyMember({
          ...form,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
      await fetchMembers();
      resetForm();
    } catch (error) {
      setError("Failed to save family member.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = (member: FamilyMember) => {
    setEditId(member.id);
    setForm({ name: member.name, isActive: member.isActive });
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
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-4 border-slate-200">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Family Members</h2>
          <p className="text-sm text-slate-500 mt-1">Manage family members.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-white hover:bg-indigo-700 font-bold transition-all shadow-lg shadow-indigo-200"
        >
          <Plus size={20} />
          <span>Add Member</span>
        </button>
      </header>

      {/* Member Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editId ? "Edit Family Member" : "Add Family Member"}
      >
        <form onSubmit={handleSubmit} className="grid gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
            <input
              className="w-full rounded-lg border px-3 py-2.5 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              placeholder="e.g. John Doe"
            />
          </div>

          <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
            <input
              type="checkbox"
              id="isMemberActive"
              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
            <label htmlFor="isMemberActive" className="text-sm font-medium text-slate-700 cursor-pointer">Member is currently Active</label>
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
              className="flex-1 rounded-xl bg-slate-100 border border-slate-200 px-4 py-3 text-slate-700 hover:bg-slate-200 font-bold transition-all"
            >
              Cancel
            </button>
          </div>

          {error && <p className="text-sm text-rose-600 bg-rose-50 p-3 rounded-lg border border-rose-100">{error}</p>}
        </form>
      </Modal>

      <section className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
        <h3 className="text-xl font-semibold mb-4">Family Members</h3>

        {loading ? (
          <p>Loading members...</p>
        ) : members.length === 0 ? (
          <p>No family members found.</p>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[400px]">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-slate-700">
                  <tr>
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={member.id} className="border-b last:border-b-0">
                      <td className="px-3 py-2 font-medium">{member.name}</td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${statusClass(member.isActive)}`}>
                          {member.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right space-x-2">
                        <button
                          onClick={() => handleEdit(member)}
                          className="rounded-md border border-blue-500 px-2 py-1 text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(member.id)}
                          className="rounded-md border border-rose-500 px-2 py-1 text-rose-600 hover:bg-rose-50 transition-colors"
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
        )}
      </section>
    </div>
  );
}

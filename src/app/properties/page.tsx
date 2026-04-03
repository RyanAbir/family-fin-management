"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getAllProperties,
  createProperty,
  updateProperty,
  deleteProperty,
} from "@/lib/db/properties";
import type { Property } from "@/types";
import { Modal } from "@/components/ui/Modal";
import { Plus } from "lucide-react";

const initialForm: Omit<Property, "id" | "createdAt" | "updatedAt"> = {
  name: "",
  type: "Rent",
  location: "",
  isActive: true,
};

export default function PropertiesPage() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchProperties = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllProperties();
      setProperties(data);
    } catch {
      setError("Failed to load properties.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const resetForm = () => {
    setForm(initialForm);
    setEditId(null);
    setIsModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    console.log("Property submit started");
    e.preventDefault();

    if (!form.name || !form.type || !form.location) {
      setError("Name, type and location are required.");
      return;
    }

    setActionLoading(true);
    setError(null);

    try {
      if (editId) {
        await updateProperty(editId, {
          name: form.name,
          type: form.type,
          location: form.location,
          isActive: form.isActive,
        });
      } else {
        const payload = {
          ...form,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        console.log("Property form payload before Firestore write", payload);
        const createdProperty = await createProperty(payload);
        console.log("Property write success", createdProperty.id);
        router.refresh();
      }
      await fetchProperties();
      resetForm();
    } catch (error) {
      console.log("Property submit caught error", error);
      setError("Failed to save property.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = (property: Property) => {
    setEditId(property.id);
    setForm({
      name: property.name,
      type: property.type,
      location: property.location,
      isActive: property.isActive,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this property?")) return;

    setActionLoading(true);
    setError(null);
    try {
      await deleteProperty(id);
      await fetchProperties();
    } catch {
      setError("Failed to delete property.");
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
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Properties</h2>
          <p className="text-sm text-slate-500 mt-1">Manage property records.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-white hover:bg-indigo-700 font-bold transition-all shadow-lg shadow-indigo-200"
        >
          <Plus size={20} />
          <span>Add Property</span>
        </button>
      </header>

      {/* Property Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editId ? "Edit Property" : "Add Property"}
      >
        <form onSubmit={handleSubmit} className="grid gap-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Name</label>
              <input
                className="w-full rounded-lg border px-3 py-2.5 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Type</label>
              <select
                className="w-full rounded-lg border px-3 py-2.5 bg-white focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                required
              >
                <option value="Rent">Rent</option>
                <option value="Shop">Shop</option>
                <option value="Residential">Residential</option>
                <option value="Commercial">Commercial</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Location</label>
              <input
                className="w-full rounded-lg border px-3 py-2.5 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
            <input
              type="checkbox"
              id="isActive"
              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
            <label htmlFor="isActive" className="text-sm font-medium text-slate-700 cursor-pointer">Property is currently Active</label>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={actionLoading}
              className="flex-1 rounded-xl bg-indigo-600 px-4 py-3 text-white hover:bg-indigo-700 font-bold disabled:opacity-50 transition-all shadow-md active:scale-95"
            >
              {actionLoading ? "Saving..." : editId ? "Update Property" : "Create Property"}
            </button>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 rounded-xl bg-slate-100 border border-slate-200 px-4 py-3 text-slate-700 hover:bg-slate-200 font-bold transition-all"
            >
              Cancel
            </button>
          </div>

          {error && (
            <p className="text-sm text-rose-600 bg-rose-50 p-3 rounded-lg border border-rose-100">{error}</p>
          )}
        </form>
      </Modal>

      <section className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
        <h3 className="text-xl font-semibold mb-4">Properties</h3>

        {loading ? (
          <p>Loading properties...</p>
        ) : properties.length === 0 ? (
          <p>No properties found.</p>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[600px]">
              <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-700">
                <tr>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Location</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {properties.map((property) => (
                  <tr key={property.id} className="border-b last:border-b-0">
                    <td className="px-3 py-2">{property.name}</td>
                    <td className="px-3 py-2">{property.type}</td>
                    <td className="px-3 py-2">{property.location}</td>
                    <td className={`px-3 py-2 text-xs font-semibold rounded-full ${statusClass(property.isActive)}`}>
                      {property.isActive ? 'Active' : 'Inactive'}
                    </td>
                    <td className="px-3 py-2 space-x-2">
                      <button
                        onClick={() => handleEdit(property)}
                        className="rounded-md border border-blue-500 px-2 py-1 text-blue-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(property.id)}
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
          </div>
        )}
      </section>
    </div>
  );
}

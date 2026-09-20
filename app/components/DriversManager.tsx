"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DriverLean, DriverStatus } from "@/types";
import StatusBadge from "@/app/components/StatusBadge";

const EMPTY_FORM = { name: "", phone: "", licenseNumber: "", status: "available" as DriverStatus, notes: "" };

export default function DriversManager({ drivers }: { drivers: DriverLean[] }) {
  const router = useRouter();
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const inputClass = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm";

  function startEdit(driver: DriverLean) {
    setEditingId(driver._id);
    setForm({
      name: driver.name,
      phone: driver.phone,
      licenseNumber: driver.licenseNumber || "",
      status: driver.status,
      notes: driver.notes || "",
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const url = editingId ? `/api/drivers/${editingId}` : "/api/drivers";
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save driver");
        return;
      }
      resetForm();
      router.refresh();
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this driver? This cannot be undone.")) return;
    const res = await fetch(`/api/drivers/${id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
        <h3 className="font-semibold text-slate-900 text-sm">
          {editingId ? "Edit driver" : "Add a new driver"}
        </h3>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <input required placeholder="Full name" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
          <input required placeholder="Phone number" value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} />
          <input placeholder="License number" value={form.licenseNumber}
            onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} className={inputClass} />
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as DriverStatus })} className={inputClass}>
            <option value="available">Available</option>
            <option value="inactive">Inactive / On leave</option>
          </select>
        </div>
        <input placeholder="Notes (optional)" value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inputClass} />
        <div className="flex gap-2">
          <button type="submit" disabled={loading} className="rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-700 disabled:opacity-60">
            {loading ? "Saving..." : editingId ? "Update Driver" : "Add Driver"}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Name</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Phone</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">License</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Status</th>
              <th className="px-4 py-3 text-right font-semibold text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {drivers.map((driver) => (
              <tr key={driver._id}>
                <td className="px-4 py-3 font-medium text-slate-900">{driver.name}</td>
                <td className="px-4 py-3 text-slate-600">{driver.phone}</td>
                <td className="px-4 py-3 text-slate-600">{driver.licenseNumber || "—"}</td>
                <td className="px-4 py-3"><StatusBadge status={driver.status} /></td>
                <td className="px-4 py-3 text-right space-x-3">
                  <button onClick={() => startEdit(driver)} className="text-blue-600 hover:underline font-medium">Edit</button>
                  <button onClick={() => handleDelete(driver._id)} className="text-red-600 hover:underline font-medium">Delete</button>
                </td>
              </tr>
            ))}
            {drivers.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-500">No drivers added yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

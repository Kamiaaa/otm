"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PickupPointLean } from "@/types";
import StatusBadge from "@/app/components/StatusBadge";

const EMPTY_FORM = { name: "", address: "", landmark: "", active: true, notes: "" };

export default function PickupPointsManager({ pickupPoints }: { pickupPoints: PickupPointLean[] }) {
  const router = useRouter();
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const inputClass = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm";

  function startEdit(point: PickupPointLean) {
    setEditingId(point._id);
    setForm({
      name: point.name,
      address: point.address,
      landmark: point.landmark || "",
      active: point.active,
      notes: point.notes || "",
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
      const url = editingId ? `/api/pickup-points/${editingId}` : "/api/pickup-points";
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save pickup point");
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
    if (!confirm("Delete this pickup point? This cannot be undone.")) return;
    const res = await fetch(`/api/pickup-points/${id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (res.ok) router.refresh();
    else alert(data.error || "Failed to delete pickup point");
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
        <h3 className="font-semibold text-slate-900 text-sm">
          {editingId ? "Edit pickup point" : "Add a new pickup point"}
        </h3>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input required placeholder="Name (e.g. Mirpur Gate)" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
          <input placeholder="Nearby landmark (optional)" value={form.landmark}
            onChange={(e) => setForm({ ...form, landmark: e.target.value })} className={inputClass} />
        </div>
        <input required placeholder="Full address" value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })} className={inputClass} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
          <input placeholder="Notes (optional)" value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inputClass} />
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })} />
            Active (selectable when requesting a car)
          </label>
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={loading} className="rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-700 disabled:opacity-60">
            {loading ? "Saving..." : editingId ? "Update Pickup Point" : "Add Pickup Point"}
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
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Address</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Landmark</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Status</th>
              <th className="px-4 py-3 text-right font-semibold text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pickupPoints.map((point) => (
              <tr key={point._id}>
                <td className="px-4 py-3 font-medium text-slate-900">{point.name}</td>
                <td className="px-4 py-3 text-slate-600">{point.address}</td>
                <td className="px-4 py-3 text-slate-600">{point.landmark || "—"}</td>
                <td className="px-4 py-3"><StatusBadge status={point.active ? "available" : "inactive"} /></td>
                <td className="px-4 py-3 text-right space-x-3">
                  <button onClick={() => startEdit(point)} className="text-blue-600 hover:underline font-medium">Edit</button>
                  <button onClick={() => handleDelete(point._id)} className="text-red-600 hover:underline font-medium">Delete</button>
                </td>
              </tr>
            ))}
            {pickupPoints.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-500">No pickup points added yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

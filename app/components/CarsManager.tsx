"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CarLean, CarStatus } from "@/types";
import StatusBadge from "@/app/components/StatusBadge";

const EMPTY_FORM = { name: "", plateNumber: "", model: "", seatCapacity: "", status: "available" as CarStatus, notes: "" };

export default function CarsManager({ cars }: { cars: CarLean[] }) {
  const router = useRouter();
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const inputClass = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm";

  function startEdit(car: CarLean) {
    setEditingId(car._id);
    setForm({
      name: car.name,
      plateNumber: car.plateNumber,
      model: car.model || "",
      seatCapacity: car.seatCapacity ? String(car.seatCapacity) : "",
      status: car.status,
      notes: car.notes || "",
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
      const url = editingId ? `/api/cars/${editingId}` : "/api/cars";
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save car");
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
    if (!confirm("Delete this car? This cannot be undone.")) return;
    const res = await fetch(`/api/cars/${id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
        <h3 className="font-semibold text-slate-900 text-sm">
          {editingId ? "Edit car" : "Add a new car"}
        </h3>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <input required placeholder="Name (e.g. Toyota Hiace)" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
          <input required placeholder="Plate number" value={form.plateNumber}
            onChange={(e) => setForm({ ...form, plateNumber: e.target.value })} className={inputClass} />
          <input placeholder="Model / year" value={form.model}
            onChange={(e) => setForm({ ...form, model: e.target.value })} className={inputClass} />
          <input type="number" min={1} placeholder="Seat capacity" value={form.seatCapacity}
            onChange={(e) => setForm({ ...form, seatCapacity: e.target.value })} className={inputClass} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as CarStatus })} className={inputClass}>
            <option value="available">Available</option>
            <option value="maintenance">Maintenance</option>
            <option value="inactive">Inactive</option>
          </select>
          <input placeholder="Notes (optional)" value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inputClass} />
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={loading} className="rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-700 disabled:opacity-60">
            {loading ? "Saving..." : editingId ? "Update Car" : "Add Car"}
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
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Plate</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Model</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Seats</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Status</th>
              <th className="px-4 py-3 text-right font-semibold text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cars.map((car) => (
              <tr key={car._id}>
                <td className="px-4 py-3 font-medium text-slate-900">{car.name}</td>
                <td className="px-4 py-3 text-slate-600">{car.plateNumber}</td>
                <td className="px-4 py-3 text-slate-600">{car.model || "—"}</td>
                <td className="px-4 py-3 text-slate-600">{car.seatCapacity || "—"}</td>
                <td className="px-4 py-3"><StatusBadge status={car.status} /></td>
                <td className="px-4 py-3 text-right space-x-3">
                  <button onClick={() => startEdit(car)} className="text-blue-600 hover:underline font-medium">Edit</button>
                  <button onClick={() => handleDelete(car._id)} className="text-red-600 hover:underline font-medium">Delete</button>
                </td>
              </tr>
            ))}
            {cars.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-500">No cars added yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CarLean, DriverLean, FuelEntryLean, FuelType } from "@/types";

export interface FuelEntryRow extends FuelEntryLean {
  distanceKm: number | null;
  kml: number | null;
  isAbnormal: boolean;
  abnormalReason: string | null;
}

const EMPTY_FORM = {
  carId: "",
  driverId: "",
  date: "",
  odometerReading: "",
  fuelQuantity: "",
  pricePerUnit: "",
  fuelType: "petrol" as FuelType,
  vendor: "",
  notes: "",
};

function displayName(v: unknown, fallback = "—") {
  if (!v) return fallback;
  if (typeof v === "string") return v;
  return (v as { name: string }).name ?? fallback;
}

export default function FuelEntriesManager({
  entries,
  cars,
  drivers,
}: {
  entries: FuelEntryRow[];
  cars: CarLean[];
  drivers: DriverLean[];
}) {
  const router = useRouter();
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const inputClass = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm";

  const previewTotal =
    form.fuelQuantity && form.pricePerUnit
      ? (Number(form.fuelQuantity) * Number(form.pricePerUnit)).toFixed(2)
      : null;

  function startEdit(entry: FuelEntryRow) {
    setEditingId(entry._id);
    const carId = typeof entry.car === "string" ? entry.car : entry.car._id;
    const driverId = entry.driver ? (typeof entry.driver === "string" ? entry.driver : entry.driver._id) : "";
    setForm({
      carId,
      driverId,
      date: entry.date,
      odometerReading: String(entry.odometerReading),
      fuelQuantity: String(entry.fuelQuantity),
      pricePerUnit: String(entry.pricePerUnit),
      fuelType: entry.fuelType,
      vendor: entry.vendor || "",
      notes: entry.notes || "",
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
      const url = editingId ? `/api/fuel-entries/${editingId}` : "/api/fuel-entries";
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save fuel entry");
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
    if (!confirm("Delete this fuel entry? This cannot be undone.")) return;
    const res = await fetch(`/api/fuel-entries/${id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (res.ok) router.refresh();
    else alert(data.error || "Failed to delete fuel entry");
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
        <h3 className="font-semibold text-slate-900 text-sm">
          {editingId ? "Edit fuel entry" : "Log a fuel entry"}
        </h3>
        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <select required value={form.carId} onChange={(e) => setForm({ ...form, carId: e.target.value })} className={inputClass}>
            <option value="">Select a car...</option>
            {cars.map((c) => (
              <option key={c._id} value={c._id}>{c.name} — {c.plateNumber}</option>
            ))}
          </select>
          <select value={form.driverId} onChange={(e) => setForm({ ...form, driverId: e.target.value })} className={inputClass}>
            <option value="">Driver (optional)</option>
            {drivers.map((d) => (
              <option key={d._id} value={d._id}>{d.name}</option>
            ))}
          </select>
          <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={inputClass} />
          <select value={form.fuelType} onChange={(e) => setForm({ ...form, fuelType: e.target.value as FuelType })} className={inputClass}>
            <option value="petrol">Petrol</option>
            <option value="diesel">Diesel</option>
            <option value="octane">Octane</option>
            <option value="cng">CNG</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input required type="number" min={0} step="0.1" placeholder="Odometer reading (km)" value={form.odometerReading}
            onChange={(e) => setForm({ ...form, odometerReading: e.target.value })} className={inputClass} />
          <input required type="number" min={0.01} step="0.01" placeholder="Fuel quantity (liters)" value={form.fuelQuantity}
            onChange={(e) => setForm({ ...form, fuelQuantity: e.target.value })} className={inputClass} />
          <input required type="number" min={0} step="0.01" placeholder="Price per liter" value={form.pricePerUnit}
            onChange={(e) => setForm({ ...form, pricePerUnit: e.target.value })} className={inputClass} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input placeholder="Vendor / station (optional)" value={form.vendor}
            onChange={(e) => setForm({ ...form, vendor: e.target.value })} className={inputClass} />
          <input placeholder="Notes (optional)" value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inputClass} />
        </div>

        {previewTotal && (
          <p className="text-sm text-slate-600">
            Total cost: <span className="font-semibold text-slate-900">{previewTotal}</span>
          </p>
        )}

        <div className="flex gap-2">
          <button type="submit" disabled={loading} className="rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-700 disabled:opacity-60">
            {loading ? "Saving..." : editingId ? "Update Entry" : "Add Entry"}
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
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Date</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Car</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Driver</th>
              <th className="px-4 py-3 text-right font-semibold text-slate-600">Odometer</th>
              <th className="px-4 py-3 text-right font-semibold text-slate-600">Qty (L)</th>
              <th className="px-4 py-3 text-right font-semibold text-slate-600">Price/L</th>
              <th className="px-4 py-3 text-right font-semibold text-slate-600">Total</th>
              <th className="px-4 py-3 text-right font-semibold text-slate-600">Km/L</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600"></th>
              <th className="px-4 py-3 text-right font-semibold text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {entries.map((entry) => (
              <tr key={entry._id} className={entry.isAbnormal ? "bg-amber-50" : undefined}>
                <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{entry.date}</td>
                <td className="px-4 py-3 font-medium text-slate-900">{displayName(entry.car)}</td>
                <td className="px-4 py-3 text-slate-600">{entry.driver ? displayName(entry.driver) : "—"}</td>
                <td className="px-4 py-3 text-right text-slate-600">{entry.odometerReading}</td>
                <td className="px-4 py-3 text-right text-slate-600">{entry.fuelQuantity}</td>
                <td className="px-4 py-3 text-right text-slate-600">{entry.pricePerUnit}</td>
                <td className="px-4 py-3 text-right font-medium text-slate-900">{entry.totalCost}</td>
                <td className="px-4 py-3 text-right text-slate-600">{entry.kml ?? "—"}</td>
                <td className="px-4 py-3">
                  {entry.isAbnormal && (
                    <span
                      title={entry.abnormalReason || undefined}
                      className="inline-flex items-center rounded-full bg-amber-100 text-amber-800 ring-1 ring-inset ring-amber-600/20 px-2 py-0.5 text-xs font-medium"
                    >
                      ⚠ Unusual
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right space-x-3 whitespace-nowrap">
                  <button onClick={() => startEdit(entry)} className="text-blue-600 hover:underline font-medium">Edit</button>
                  <button onClick={() => handleDelete(entry._id)} className="text-red-600 hover:underline font-medium">Delete</button>
                </td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr><td colSpan={10} className="px-4 py-6 text-center text-slate-500">No fuel entries logged yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

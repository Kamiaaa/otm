"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { RouteLean, PickupPointLean } from "@/types";
import StatusBadge from "@/app/components/StatusBadge";

const EMPTY_FORM = {
  name: "",
  description: "",
  destination: "",
  estimatedDistanceKm: "",
  estimatedDurationMinutes: "",
  active: true,
};

function stopName(stop: RouteLean["pickupPoints"][number]) {
  return typeof stop === "string" ? stop : stop.name;
}
function stopId(stop: RouteLean["pickupPoints"][number]) {
  return typeof stop === "string" ? stop : stop._id;
}

export default function RoutesManager({
  routes,
  pickupPoints,
}: {
  routes: RouteLean[];
  pickupPoints: PickupPointLean[];
}) {
  const router = useRouter();
  const [form, setForm] = useState(EMPTY_FORM);
  const [stops, setStops] = useState<string[]>([""]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const inputClass = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm";

  function startEdit(route: RouteLean) {
    setEditingId(route._id);
    setForm({
      name: route.name,
      description: route.description || "",
      destination: route.destination,
      estimatedDistanceKm: route.estimatedDistanceKm ? String(route.estimatedDistanceKm) : "",
      estimatedDurationMinutes: route.estimatedDurationMinutes ? String(route.estimatedDurationMinutes) : "",
      active: route.active,
    });
    setStops(route.pickupPoints.map(stopId));
  }

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setStops([""]);
  }

  function updateStop(index: number, value: string) {
    setStops((s) => s.map((v, i) => (i === index ? value : v)));
  }
  function addStop() {
    setStops((s) => [...s, ""]);
  }
  function removeStop(index: number) {
    setStops((s) => s.filter((_, i) => i !== index));
  }
  function moveStop(index: number, dir: -1 | 1) {
    setStops((s) => {
      const next = [...s];
      const target = index + dir;
      if (target < 0 || target >= next.length) return s;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const pickupPointIds = stops.filter(Boolean);
    if (pickupPointIds.length === 0) {
      setError("Add at least one stop");
      return;
    }

    setLoading(true);
    try {
      const url = editingId ? `/api/routes/${editingId}` : "/api/routes";
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, pickupPoints: pickupPointIds }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save route");
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
    if (!confirm("Delete this route? This cannot be undone.")) return;
    const res = await fetch(`/api/routes/${id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (res.ok) router.refresh();
    else alert(data.error || "Failed to delete route");
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
        <h3 className="font-semibold text-slate-900 text-sm">
          {editingId ? "Edit route" : "Add a new route"}
        </h3>
        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input required placeholder="Route name (e.g. Mirpur Loop)" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
          <input required placeholder="Destination (e.g. Head Office)" value={form.destination}
            onChange={(e) => setForm({ ...form, destination: e.target.value })} className={inputClass} />
        </div>
        <input placeholder="Description (optional)" value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputClass} />

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Stops, in pickup order
          </label>
          <div className="space-y-2">
            {stops.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs text-slate-400 w-4">{i + 1}.</span>
                <select
                  value={s}
                  onChange={(e) => updateStop(i, e.target.value)}
                  className={inputClass}
                >
                  <option value="">Select a pickup point...</option>
                  {pickupPoints.map((p) => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
                <button type="button" onClick={() => moveStop(i, -1)} disabled={i === 0}
                  className="px-2 py-1 text-xs rounded border border-slate-300 disabled:opacity-30">↑</button>
                <button type="button" onClick={() => moveStop(i, 1)} disabled={i === stops.length - 1}
                  className="px-2 py-1 text-xs rounded border border-slate-300 disabled:opacity-30">↓</button>
                <button type="button" onClick={() => removeStop(i)} disabled={stops.length === 1}
                  className="px-2 py-1 text-xs rounded border border-red-300 text-red-600 disabled:opacity-30">✕</button>
              </div>
            ))}
          </div>
          <button type="button" onClick={addStop} className="mt-2 text-sm text-blue-600 font-medium hover:underline">
            + Add another stop
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
          <input type="number" min={0} placeholder="Distance (km, optional)" value={form.estimatedDistanceKm}
            onChange={(e) => setForm({ ...form, estimatedDistanceKm: e.target.value })} className={inputClass} />
          <input type="number" min={0} placeholder="Duration (min, optional)" value={form.estimatedDurationMinutes}
            onChange={(e) => setForm({ ...form, estimatedDurationMinutes: e.target.value })} className={inputClass} />
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })} />
            Active (selectable when requesting a car)
          </label>
        </div>

        <div className="flex gap-2">
          <button type="submit" disabled={loading} className="rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-700 disabled:opacity-60">
            {loading ? "Saving..." : editingId ? "Update Route" : "Add Route"}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
        {routes.map((route) => (
          <div key={route._id} className="px-4 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="font-medium text-slate-900">
                {route.name} <StatusBadge status={route.active ? "available" : "inactive"} />
              </p>
              <p className="text-sm text-slate-600 mt-0.5">
                {route.pickupPoints.map(stopName).join(" → ")} → {route.destination}
              </p>
              {(route.estimatedDistanceKm || route.estimatedDurationMinutes) && (
                <p className="text-xs text-slate-500 mt-0.5">
                  {route.estimatedDistanceKm ? `${route.estimatedDistanceKm} km` : ""}
                  {route.estimatedDistanceKm && route.estimatedDurationMinutes ? " · " : ""}
                  {route.estimatedDurationMinutes ? `${route.estimatedDurationMinutes} min` : ""}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button onClick={() => startEdit(route)} className="text-blue-600 hover:underline font-medium text-sm">Edit</button>
              <button onClick={() => handleDelete(route._id)} className="text-red-600 hover:underline font-medium text-sm">Delete</button>
            </div>
          </div>
        ))}
        {routes.length === 0 && (
          <p className="px-4 py-8 text-center text-slate-500 text-sm">No routes added yet.</p>
        )}
      </div>
    </div>
  );
}

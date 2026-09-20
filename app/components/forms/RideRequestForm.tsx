"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { UserLean, RouteLean, PickupPointLean } from "@/types";

export default function RideRequestForm({
  employees,
  routes,
  pickupPoints,
  isAdmin,
}: {
  employees?: UserLean[];
  routes: RouteLean[];
  pickupPoints: PickupPointLean[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    employeeId: "",
    purpose: "",
    routeId: "",
    pickupPointId: "",
    pickupLocation: "",
    dropLocation: "",
    rideDate: "",
    startTime: "",
    endTime: "",
    passengers: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleRouteChange(routeId: string) {
    const route = routes.find((r) => r._id === routeId);
    setForm((f) => ({
      ...f,
      routeId,
      pickupPointId: "", // route and a standalone pickup point are mutually exclusive
      pickupLocation: route
        ? nameOf(route.pickupPoints[0]) || f.pickupLocation
        : f.pickupLocation,
      dropLocation: route ? route.destination : f.dropLocation,
    }));
  }

  function handlePickupPointChange(pickupPointId: string) {
    const point = pickupPoints.find((p) => p._id === pickupPointId);
    setForm((f) => ({
      ...f,
      pickupPointId,
      routeId: "",
      pickupLocation: point ? `${point.name} — ${point.address}` : f.pickupLocation,
    }));
  }

  function nameOf(stop: RouteLean["pickupPoints"][number]) {
    if (!stop) return "";
    return typeof stop === "string" ? "" : stop.name;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/rides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to submit request");
        return;
      }
      router.push("/dashboard/rides");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
  const labelClass = "block text-sm font-medium text-slate-700 mb-1";
  const selectedRoute = routes.find((r) => r._id === form.routeId);

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
          {error}
        </div>
      )}

      {isAdmin && employees && (
        <div>
          <label className={labelClass}>Employee</label>
          <select
            required
            value={form.employeeId}
            onChange={(e) => update("employeeId", e.target.value)}
            className={inputClass}
          >
            <option value="">Select an employee...</option>
            {employees.map((emp) => (
              <option key={emp._id} value={emp._id}>
                {emp.name} {emp.department ? `(${emp.department})` : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className={labelClass}>Purpose of the trip</label>
        <textarea
          required
          value={form.purpose}
          onChange={(e) => update("purpose", e.target.value)}
          className={inputClass}
          rows={3}
          placeholder="e.g. Client meeting at Gulshan office"
        />
      </div>

      {(routes.length > 0 || pickupPoints.length > 0) && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-3">
          <p className="text-xs font-medium text-slate-600">
            Optional: pick a saved route or pickup point to auto-fill the locations below.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {routes.length > 0 && (
              <div>
                <label className={labelClass}>Saved route</label>
                <select
                  value={form.routeId}
                  onChange={(e) => handleRouteChange(e.target.value)}
                  className={inputClass}
                >
                  <option value="">No route selected</option>
                  {routes.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.name} → {r.destination}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {pickupPoints.length > 0 && (
              <div>
                <label className={labelClass}>Or just a pickup point</label>
                <select
                  value={form.pickupPointId}
                  onChange={(e) => handlePickupPointChange(e.target.value)}
                  className={inputClass}
                >
                  <option value="">No pickup point selected</option>
                  {pickupPoints.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          {selectedRoute && selectedRoute.pickupPoints.length > 1 && (
            <p className="text-xs text-slate-500">
              Stops:{" "}
              {selectedRoute.pickupPoints
                .map((s) => (typeof s === "string" ? s : s.name))
                .join(" → ")}{" "}
              → {selectedRoute.destination}
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Pickup location</label>
          <input
            required
            value={form.pickupLocation}
            onChange={(e) => update("pickupLocation", e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Drop-off location</label>
          <input
            required
            value={form.dropLocation}
            onChange={(e) => update("dropLocation", e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className={labelClass}>Date</label>
          <input
            type="date"
            required
            value={form.rideDate}
            onChange={(e) => update("rideDate", e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Start time</label>
          <input
            type="time"
            required
            value={form.startTime}
            onChange={(e) => update("startTime", e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>End time (est.)</label>
          <input
            type="time"
            value={form.endTime}
            onChange={(e) => update("endTime", e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Number of passengers</label>
        <input
          type="number"
          min={1}
          value={form.passengers}
          onChange={(e) => update("passengers", e.target.value)}
          className={inputClass}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-blue-600 text-white px-5 py-2 text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 transition-colors"
      >
        {loading ? "Submitting..." : "Submit Request"}
      </button>
    </form>
  );
}

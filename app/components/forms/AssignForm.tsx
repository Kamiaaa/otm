"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { CarLean, DriverLean } from "@/types";

export default function AssignForm({
  rideId,
  rideDate,
}: {
  rideId: string;
  rideDate: string;
}) {
  const router = useRouter();
  const [cars, setCars] = useState<CarLean[]>([]);
  const [drivers, setDrivers] = useState<DriverLean[]>([]);
  const [carId, setCarId] = useState("");
  const [driverId, setDriverId] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAvailability = useCallback(async () => {
    setFetching(true);
    try {
      const res = await fetch(
        `/api/rides/available-resources?date=${rideDate}&excludeRideId=${rideId}`
      );
      const data = await res.json();
      if (res.ok) {
        setCars(data.cars);
        setDrivers(data.drivers);
      }
    } finally {
      setFetching(false);
    }
  }, [rideDate, rideId]);

  useEffect(() => {
    loadAvailability();
  }, [loadAvailability]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!carId || !driverId) {
      setError("Please select both a car and a driver");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/rides/${rideId}/assign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ carId, driverId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to assign");
        return;
      }
      router.refresh();
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <h3 className="font-semibold text-slate-900 text-sm">Assign a car &amp; driver</h3>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {fetching ? (
        <p className="text-sm text-slate-500">Checking availability for {rideDate}...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Available cars ({cars.length})
              </label>
              <select
                value={carId}
                onChange={(e) => setCarId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">Select a car...</option>
                {cars.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} — {c.plateNumber}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Available drivers ({drivers.length})
              </label>
              <select
                value={driverId}
                onChange={(e) => setDriverId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">Select a driver...</option>
                {drivers.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name} — {d.phone}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {(cars.length === 0 || drivers.length === 0) && (
            <p className="text-xs text-amber-700">
              No available car or driver for this date. Free one up or pick another date.
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Assigning..." : "Assign Duty"}
          </button>
        </>
      )}
    </form>
  );
}

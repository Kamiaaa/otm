"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { RideStatus } from "@/types";

export default function RideStatusActions({
  rideId,
  status,
  isOwner,
  isAdmin,
}: {
  rideId: string;
  status: RideStatus;
  isOwner: boolean;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canAct = isOwner || isAdmin;
  if (!canAct || ["completed", "cancelled"].includes(status)) return null;

  async function changeStatus(next: "ongoing" | "completed" | "cancelled") {
    setError(null);
    setLoading(next);
    try {
      const res = await fetch(`/api/rides/${rideId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update status");
        return;
      }
      router.refresh();
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex flex-wrap gap-2">
        {status === "assigned" && (
          <button
            onClick={() => changeStatus("ongoing")}
            disabled={loading !== null}
            className="rounded-lg bg-purple-600 text-white px-4 py-2 text-sm font-semibold hover:bg-purple-700 disabled:opacity-60"
          >
            {loading === "ongoing" ? "Starting..." : "Start Ride"}
          </button>
        )}
        {(status === "assigned" || status === "ongoing") && (
          <button
            onClick={() => changeStatus("completed")}
            disabled={loading !== null}
            className="rounded-lg bg-emerald-600 text-white px-4 py-2 text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60"
          >
            {loading === "completed" ? "Saving..." : "Mark Ride Completed"}
          </button>
        )}
        {["pending", "assigned", "ongoing"].includes(status) && (
          <button
            onClick={() => changeStatus("cancelled")}
            disabled={loading !== null}
            className="rounded-lg border border-red-300 text-red-700 px-4 py-2 text-sm font-semibold hover:bg-red-50 disabled:opacity-60"
          >
            {loading === "cancelled" ? "Cancelling..." : "Cancel Ride"}
          </button>
        )}
      </div>
      {isAdmin && !isOwner && (
        <p className="text-xs text-slate-500">
          You&apos;re changing this on behalf of the employee, since they may have forgotten to update it.
        </p>
      )}
    </div>
  );
}

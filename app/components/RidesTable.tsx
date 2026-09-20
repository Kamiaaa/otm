"use client";

import Link from "next/link";
import type { RideLean } from "@/types";
import StatusBadge from "@/app/components/StatusBadge";

function name(v: unknown, fallback = "—") {
  if (!v) return fallback;
  if (typeof v === "string") return v;
  return (v as { name: string }).name ?? fallback;
}

export default function RidesTable({
  rides,
  showEmployeeColumn,
}: {
  rides: RideLean[];
  showEmployeeColumn: boolean;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            {showEmployeeColumn && (
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Employee</th>
            )}
            <th className="px-4 py-3 text-left font-semibold text-slate-600">Date / Time</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-600">Purpose</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-600">Pickup → Drop</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-600">Car / Driver</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-600">Status</th>
            <th className="px-4 py-3 text-right font-semibold text-slate-600"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rides.map((ride) => (
            <tr key={ride._id}>
              {showEmployeeColumn && (
                <td className="px-4 py-3 font-medium text-slate-900">{name(ride.employee)}</td>
              )}
              <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                {ride.rideDate} · {ride.startTime}
              </td>
              <td className="px-4 py-3 text-slate-600 max-w-xs truncate" title={ride.purpose}>
                {ride.purpose}
              </td>
              <td className="px-4 py-3 text-slate-600">
                {ride.pickupLocation} → {ride.dropLocation}
              </td>
              <td className="px-4 py-3 text-slate-600">
                {ride.car ? name(ride.car) : "—"} / {ride.driver ? name(ride.driver) : "—"}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={ride.status} />
              </td>
              <td className="px-4 py-3 text-right">
                <Link href={`/dashboard/rides/${ride._id}`} className="text-blue-600 hover:underline font-medium">
                  View
                </Link>
              </td>
            </tr>
          ))}
          {rides.length === 0 && (
            <tr>
              <td colSpan={showEmployeeColumn ? 7 : 6} className="px-4 py-6 text-center text-slate-500">
                No rides found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

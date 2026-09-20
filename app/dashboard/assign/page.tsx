import Link from "next/link";
import { connectDB } from "@/lib/db";
import Ride from "@/models/Ride";
import StatusBadge from "@/app/components/StatusBadge";
import type { RideLean } from "@/types";

export default async function AssignDutyPage() {
  await connectDB();
  const pendingDocs = await Ride.find({ status: "pending" })
    .sort({ rideDate: 1, startTime: 1 })
    .populate("employee", "name department")
    .lean();
  const pending = JSON.parse(JSON.stringify(pendingDocs)) as RideLean[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Assign Duty</h1>
          <p className="text-sm text-slate-500 mt-1">
            Pick a car and driver for pending requests, based on same-day availability.
          </p>
        </div>
        <Link
          href="/dashboard/rides/new"
          className="rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-700"
        >
          + Create Duty Directly
        </Link>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
        {pending.map((ride) => (
          <div key={ride._id} className="px-4 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="font-medium text-slate-900">
                {typeof ride.employee === "object" ? ride.employee.name : "Employee"}
                <span className="text-slate-500 font-normal"> · {ride.rideDate} at {ride.startTime}</span>
              </p>
              <p className="text-sm text-slate-600">{ride.purpose}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {ride.pickupLocation} → {ride.dropLocation}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={ride.status} />
              <Link
                href={`/dashboard/rides/${ride._id}`}
                className="rounded-lg bg-blue-600 text-white px-3 py-1.5 text-sm font-semibold hover:bg-blue-700"
              >
                Assign
              </Link>
            </div>
          </div>
        ))}
        {pending.length === 0 && (
          <p className="px-4 py-8 text-center text-slate-500 text-sm">
            No pending requests right now. 🎉
          </p>
        )}
      </div>
    </div>
  );
}

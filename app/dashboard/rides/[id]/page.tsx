import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Ride from "@/models/Ride";
import StatusBadge from "@/app/components/StatusBadge";
import RideStatusActions from "@/app/components/RideStatusActions";
import AssignForm from "@/app/components/forms/AssignForm";
import type { RideLean } from "@/types";

function displayName(v: unknown, fallback = "—") {
  if (!v) return fallback;
  if (typeof v === "string") return v;
  return (v as { name: string }).name ?? fallback;
}

export default async function RideDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getSessionUser();
  await connectDB();

  const rideDoc = await Ride.findById(id)
    .populate("employee", "name email department")
    .populate("car", "name plateNumber")
    .populate("driver", "name phone")
    .populate("assignedBy", "name")
    .populate("completedBy", "name")
    .populate("route", "name")
    .lean();

  if (!rideDoc) notFound();
  const ride = JSON.parse(JSON.stringify(rideDoc)) as RideLean;

  const isAdmin = user?.role === "admin";
  const isOwner = typeof ride.employee === "object" ? ride.employee._id === user?.id : ride.employee === user?.id;

  const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 py-2 border-b border-slate-100 last:border-0">
      <dt className="w-40 shrink-0 text-sm text-slate-500">{label}</dt>
      <dd className="text-sm text-slate-900">{value}</dd>
    </div>
  );

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Ride Details</h1>
        <StatusBadge status={ride.status} />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <dl>
          <Row label="Employee" value={displayName(ride.employee)} />
          <Row label="Purpose" value={ride.purpose} />
          <Row label="Locations" value={`${ride.pickupLocation} → ${ride.dropLocation}`} />
          {ride.route && <Row label="Saved route" value={displayName(ride.route)} />}
          <Row label="Date" value={ride.rideDate} />
          <Row label="Time" value={`${ride.startTime}${ride.endTime ? ` – ${ride.endTime}` : ""}`} />
          {ride.passengers && <Row label="Passengers" value={ride.passengers} />}
          <Row label="Car" value={ride.car ? displayName(ride.car) : "Not yet assigned"} />
          <Row label="Driver" value={ride.driver ? displayName(ride.driver) : "Not yet assigned"} />
          {ride.assignedBy && <Row label="Assigned by" value={displayName(ride.assignedBy)} />}
          {ride.completedBy && (
            <Row
              label="Completed by"
              value={`${displayName(ride.completedBy)}${ride.statusChangedByRole === "admin" ? " (admin, on behalf of employee)" : ""}`}
            />
          )}
          {ride.remarks && <Row label="Remarks" value={ride.remarks} />}
        </dl>
      </div>

      {isAdmin && ["pending", "assigned"].includes(ride.status) && (
        <AssignForm rideId={ride._id} rideDate={ride.rideDate} />
      )}

      <RideStatusActions rideId={ride._id} status={ride.status} isOwner={isOwner} isAdmin={!!isAdmin} />
    </div>
  );
}

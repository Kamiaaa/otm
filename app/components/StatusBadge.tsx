import type { RideStatus, CarStatus, DriverStatus } from "@/types";

const STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 ring-amber-600/20",
  assigned: "bg-blue-100 text-blue-800 ring-blue-600/20",
  ongoing: "bg-purple-100 text-purple-800 ring-purple-600/20",
  completed: "bg-emerald-100 text-emerald-800 ring-emerald-600/20",
  cancelled: "bg-red-100 text-red-800 ring-red-600/20",
  available: "bg-emerald-100 text-emerald-800 ring-emerald-600/20",
  maintenance: "bg-amber-100 text-amber-800 ring-amber-600/20",
  inactive: "bg-slate-100 text-slate-700 ring-slate-500/20",
};

export default function StatusBadge({
  status,
}: {
  status: RideStatus | CarStatus | DriverStatus;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${
        STYLES[status] ?? "bg-slate-100 text-slate-700 ring-slate-500/20"
      }`}
    >
      {status}
    </span>
  );
}

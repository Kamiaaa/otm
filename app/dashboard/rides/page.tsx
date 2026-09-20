import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Ride from "@/models/Ride";
import RidesTable from "@/app/components/RidesTable";
import type { RideLean } from "@/types";

export default async function RidesPage() {
  const user = await getSessionUser();
  await connectDB();

  const isAdmin = user?.role === "admin";
  const query = isAdmin ? {} : { employee: user?.id };

  const rides = await Ride.find(query)
    .sort({ createdAt: -1 })
    .populate("employee", "name email department")
    .populate("car", "name plateNumber")
    .populate("driver", "name phone")
    .lean();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{isAdmin ? "All Rides" : "My Rides"}</h1>
          <p className="text-sm text-slate-500 mt-1">
            {isAdmin
              ? "Every ride request, its status, and assigned resources."
              : "Track your car requests and update the status once your ride ends."}
          </p>
        </div>
        <Link
          href="/dashboard/rides/new"
          className="rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-700"
        >
          + New Request
        </Link>
      </div>
      <RidesTable rides={JSON.parse(JSON.stringify(rides)) as RideLean[]} showEmployeeColumn={isAdmin} />
    </div>
  );
}

import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Ride from "@/models/Ride";
import Car from "@/models/Car";
import Driver from "@/models/Driver";
import User from "@/models/User";
import StatusBadge from "@/app/components/StatusBadge";

function StatCard({ label, value, href }: { label: string; value: number | string; href?: string }) {
  const content = (
    <div className="rounded-xl border border-slate-200 bg-white p-5 hover:shadow-sm transition-shadow">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

export default async function DashboardOverviewPage() {
  const user = await getSessionUser();
  await connectDB();

  if (user?.role === "admin") {
    const [pendingCount, ongoingCount, carsCount, driversCount, employeesCount, recentRides] =
      await Promise.all([
        Ride.countDocuments({ status: "pending" }),
        Ride.countDocuments({ status: { $in: ["assigned", "ongoing"] } }),
        Car.countDocuments({ status: "available" }),
        Driver.countDocuments({ status: "available" }),
        User.countDocuments({ role: "employee" }),
        Ride.find().sort({ createdAt: -1 }).limit(6).populate("employee", "name").lean(),
      ]);

    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Overview</h1>
          <p className="text-sm text-slate-500 mt-1">A snapshot of today&apos;s car duty operations.</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard label="Pending Requests" value={pendingCount} href="/dashboard/assign" />
          <StatCard label="Active Duties" value={ongoingCount} href="/dashboard/rides" />
          <StatCard label="Available Cars" value={carsCount} href="/dashboard/cars" />
          <StatCard label="Available Drivers" value={driversCount} href="/dashboard/drivers" />
          <StatCard label="Employees" value={employeesCount} href="/dashboard/employees" />
        </div>
        <div>
          <h2 className="font-semibold text-slate-900 mb-3">Recent activity</h2>
          <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
            {recentRides.map((r) => (
              <div key={String(r._id)} className="px-4 py-3 flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium text-slate-900">
                    {(r.employee as unknown as { name: string })?.name || "Unknown"}
                  </span>
                  <span className="text-slate-500"> · {r.purpose}</span>
                </div>
                <StatusBadge status={r.status} />
              </div>
            ))}
            {recentRides.length === 0 && (
              <p className="px-4 py-6 text-center text-slate-500 text-sm">No rides yet.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Employee overview
  const myRides = await Ride.find({ employee: user?.id })
    .sort({ createdAt: -1 })
    .limit(8)
    .populate("car", "name plateNumber")
    .populate("driver", "name phone")
    .lean();

  const activeCount = myRides.filter((r) => ["pending", "assigned", "ongoing"].includes(r.status)).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Welcome, {user?.name}</h1>
        <p className="text-sm text-slate-500 mt-1">Here&apos;s what&apos;s happening with your rides.</p>
      </div>
      <div className="grid grid-cols-2 gap-4 max-w-md">
        <StatCard label="Active Requests" value={activeCount} href="/dashboard/rides" />
        <StatCard label="New Request" value="+ Create" href="/dashboard/rides/new" />
      </div>
      <div>
        <h2 className="font-semibold text-slate-900 mb-3">My recent rides</h2>
        <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
          {myRides.map((r) => (
            <div key={String(r._id)} className="px-4 py-3 flex items-center justify-between text-sm">
              <div>
                <span className="font-medium text-slate-900">{r.rideDate}</span>
                <span className="text-slate-500"> · {r.purpose}</span>
              </div>
              <StatusBadge status={r.status} />
            </div>
          ))}
          {myRides.length === 0 && (
            <p className="px-4 py-6 text-center text-slate-500 text-sm">
              You haven&apos;t requested a car yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

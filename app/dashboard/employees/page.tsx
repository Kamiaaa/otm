import { getSessionUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import EmployeesManager from "@/app/components/EmployeesManager";
import type { UserLean } from "@/types";

export default async function EmployeesPage() {
  const user = await getSessionUser();
  await connectDB();
  const docs = await User.find().select("-password").sort({ name: 1 }).lean();
  const employees = JSON.parse(JSON.stringify(docs)) as UserLean[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Employees</h1>
        <p className="text-sm text-slate-500 mt-1">Manage who can log in, and their role.</p>
      </div>
      <EmployeesManager employees={employees} currentUserId={user?.id || ""} />
    </div>
  );
}

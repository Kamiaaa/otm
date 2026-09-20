import { getSessionUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Route from "@/models/Route";
import PickupPoint from "@/models/PickupPoint";
import RideRequestForm from "@/app/components/forms/RideRequestForm";
import type { UserLean, RouteLean, PickupPointLean } from "@/types";

export default async function NewRidePage() {
  const user = await getSessionUser();
  const isAdmin = user?.role === "admin";

  await connectDB();
  const [routeDocs, pickupPointDocs] = await Promise.all([
    Route.find({ active: true }).populate("pickupPoints", "name address").sort({ name: 1 }).lean(),
    PickupPoint.find({ active: true }).sort({ name: 1 }).lean(),
  ]);
  const routes = JSON.parse(JSON.stringify(routeDocs)) as RouteLean[];
  const pickupPoints = JSON.parse(JSON.stringify(pickupPointDocs)) as PickupPointLean[];

  let employees: UserLean[] = [];
  if (isAdmin) {
    const docs = await User.find({ role: "employee", active: true }).sort({ name: 1 }).lean();
    employees = JSON.parse(JSON.stringify(docs));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {isAdmin ? "Create a Duty Request" : "Request a Car"}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {isAdmin
            ? "Log a car request on behalf of an employee. You can assign a car & driver right after."
            : "Tell us the purpose and details, and an admin will arrange a car for you."}
        </p>
      </div>
      <RideRequestForm
        employees={isAdmin ? employees : undefined}
        routes={routes}
        pickupPoints={pickupPoints}
        isAdmin={isAdmin}
      />
    </div>
  );
}

import { connectDB } from "@/lib/db";
import Route from "@/models/Route";
import PickupPoint from "@/models/PickupPoint";
import RoutesManager from "@/app/components/RoutesManager";
import type { RouteLean, PickupPointLean } from "@/types";

export default async function RoutesPage() {
  await connectDB();
  const [routeDocs, pickupPointDocs] = await Promise.all([
    Route.find().populate("pickupPoints", "name address").sort({ name: 1 }).lean(),
    PickupPoint.find({ active: true }).sort({ name: 1 }).lean(),
  ]);
  const routes = JSON.parse(JSON.stringify(routeDocs)) as RouteLean[];
  const pickupPoints = JSON.parse(JSON.stringify(pickupPointDocs)) as PickupPointLean[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Routes</h1>
        <p className="text-sm text-slate-500 mt-1">
          Chain pickup points into a reusable trip template (e.g. a multi-stop office shuttle) with an estimated distance/duration.
        </p>
      </div>
      <RoutesManager routes={routes} pickupPoints={pickupPoints} />
    </div>
  );
}

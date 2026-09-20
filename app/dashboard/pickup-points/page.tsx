import { connectDB } from "@/lib/db";
import PickupPoint from "@/models/PickupPoint";
import PickupPointsManager from "@/app/components/PickupPointsManager";
import type { PickupPointLean } from "@/types";

export default async function PickupPointsPage() {
  await connectDB();
  const docs = await PickupPoint.find().sort({ name: 1 }).lean();
  const pickupPoints = JSON.parse(JSON.stringify(docs)) as PickupPointLean[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Pickup Points</h1>
        <p className="text-sm text-slate-500 mt-1">
          Named locations employees can pick from when requesting a car, instead of typing an address each time.
        </p>
      </div>
      <PickupPointsManager pickupPoints={pickupPoints} />
    </div>
  );
}

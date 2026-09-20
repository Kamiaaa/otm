import { connectDB } from "@/lib/db";
import Driver from "@/models/Driver";
import DriversManager from "@/app/components/DriversManager";
import type { DriverLean } from "@/types";

export default async function DriversPage() {
  await connectDB();
  const docs = await Driver.find().sort({ name: 1 }).lean();
  const drivers = JSON.parse(JSON.stringify(docs)) as DriverLean[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Drivers</h1>
        <p className="text-sm text-slate-500 mt-1">Add, update, or mark drivers unavailable.</p>
      </div>
      <DriversManager drivers={drivers} />
    </div>
  );
}

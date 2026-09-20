import { connectDB } from "@/lib/db";
import Car from "@/models/Car";
import CarsManager from "@/app/components/CarsManager";
import type { CarLean } from "@/types";

export default async function CarsPage() {
  await connectDB();
  const docs = await Car.find().sort({ name: 1 }).lean();
  const cars = JSON.parse(JSON.stringify(docs)) as CarLean[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Cars</h1>
        <p className="text-sm text-slate-500 mt-1">Add, update, or retire office cars.</p>
      </div>
      <CarsManager cars={cars} />
    </div>
  );
}

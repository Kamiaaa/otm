import { connectDB } from "@/lib/db";
import FuelEntry from "@/models/FuelEntry";
import Car from "@/models/Car";
import Driver from "@/models/Driver";
import FuelEntriesManager, { type FuelEntryRow } from "@/app/components/FuelEntriesManager";
import { computeFuelMetrics, aggregateByCar, aggregateByMonth, type FuelEntryForCalc } from "@/lib/fuel";
import type { CarLean, DriverLean, FuelEntryLean } from "@/types";

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

export default async function FuelPage() {
  await connectDB();

  const [carDocs, driverDocs, entryDocs] = await Promise.all([
    Car.find().sort({ name: 1 }).lean(),
    Driver.find().sort({ name: 1 }).lean(),
    FuelEntry.find()
      .populate("car", "name plateNumber")
      .populate("driver", "name")
      .sort({ date: -1, createdAt: -1 })
      .lean(),
  ]);

  const cars = JSON.parse(JSON.stringify(carDocs)) as CarLean[];
  const drivers = JSON.parse(JSON.stringify(driverDocs)) as DriverLean[];
  const entries = JSON.parse(JSON.stringify(entryDocs)) as FuelEntryLean[];

  // Calculations need a flat car-id string per entry, independent of population.
  const calcEntries: FuelEntryForCalc[] = entries.map((e) => ({
    _id: e._id,
    car: typeof e.car === "string" ? e.car : e.car._id,
    odometerReading: e.odometerReading,
    fuelQuantity: e.fuelQuantity,
    totalCost: e.totalCost,
    date: e.date,
  }));

  const computed = computeFuelMetrics(calcEntries);
  const rows: FuelEntryRow[] = entries.map((e) => {
    const c = computed.get(e._id);
    return {
      ...e,
      distanceKm: c?.distanceKm ?? null,
      kml: c?.kml ?? null,
      isAbnormal: c?.isAbnormal ?? false,
      abnormalReason: c?.abnormalReason ?? null,
    };
  });

  const carStats = aggregateByCar(calcEntries, computed);
  const monthlyStats = aggregateByMonth(calcEntries);

  const carNameById = new Map(cars.map((c) => [c._id, `${c.name} (${c.plateNumber})`]));

  const totalCost = calcEntries.reduce((s, e) => s + e.totalCost, 0);
  const totalLiters = calcEntries.reduce((s, e) => s + e.fuelQuantity, 0);
  const abnormalCount = rows.filter((r) => r.isAbnormal).length;
  const totalValidDistance = carStats.reduce((s, c) => s + c.totalDistanceKm, 0);
  const totalValidLiters = carStats.reduce((s, c) => s + c.litersEligibleForKml, 0);
  const fleetAvgKml = totalValidLiters > 0 ? (totalValidDistance / totalValidLiters).toFixed(2) : "—";

  const abnormalRows = rows.filter((r) => r.isAbnormal).slice(0, 10);
  const maxMonthlyCost = Math.max(1, ...monthlyStats.map((m) => m.totalCost));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Fuel Management</h1>
        <p className="text-sm text-slate-500 mt-1">
          Log fill-ups, track cost per vehicle, and catch unusual consumption early.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Fuel Cost" value={totalCost.toFixed(2)} hint="All recorded entries" />
        <StatCard label="Total Fuel Purchased" value={`${totalLiters.toFixed(2)} L`} />
        <StatCard label="Fleet Avg." value={fleetAvgKml !== "—" ? `${fleetAvgKml} km/L` : "—"} hint="Distance-weighted" />
        <StatCard label="Flagged Entries" value={String(abnormalCount)} hint="Unusual km/L vs. vehicle history" />
      </div>

      {abnormalRows.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <h2 className="font-semibold text-amber-900 text-sm mb-2">⚠ Abnormal fuel consumption detected</h2>
          <ul className="space-y-1.5 text-sm text-amber-900">
            {abnormalRows.map((r) => (
              <li key={r._id}>
                <span className="font-medium">
                  {typeof r.car === "string" ? carNameById.get(r.car) ?? r.car : `${r.car.name} (${r.car.plateNumber})`}
                </span>{" "}
                on {r.date}: {r.abnormalReason}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <h2 className="font-semibold text-slate-900 mb-3">Vehicle-wise fuel consumption</h2>
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Vehicle</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Fill-ups</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Total Liters</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Total Cost</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Avg Km/L</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Latest Odometer</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Flags</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {carStats.map((stat) => (
                <tr key={stat.carId}>
                  <td className="px-4 py-3 font-medium text-slate-900">{carNameById.get(stat.carId) ?? "Unknown car"}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{stat.fillCount}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{stat.totalLiters.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{stat.totalCost.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{stat.avgKml ?? "—"}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{stat.latestOdometer ?? "—"}</td>
                  <td className="px-4 py-3 text-right">
                    {stat.abnormalCount > 0 ? (
                      <span className="text-amber-700 font-medium">{stat.abnormalCount}</span>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </td>
                </tr>
              ))}
              {carStats.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-500">No fuel data yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="font-semibold text-slate-900 mb-3">Monthly fuel expense</h2>
        <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
          {monthlyStats.map((m) => (
            <div key={m.month} className="px-4 py-3">
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="font-medium text-slate-900">{m.month}</span>
                <span className="text-slate-600">
                  {m.totalCost.toFixed(2)} · {m.totalLiters.toFixed(2)} L · {m.fillCount} fill-ups
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-500"
                  style={{ width: `${Math.max(4, (m.totalCost / maxMonthlyCost) * 100)}%` }}
                />
              </div>
            </div>
          ))}
          {monthlyStats.length === 0 && (
            <p className="px-4 py-6 text-center text-slate-500 text-sm">No fuel data yet.</p>
          )}
        </div>
      </div>

      <div>
        <h2 className="font-semibold text-slate-900 mb-3">Fuel entries</h2>
        <FuelEntriesManager entries={rows} cars={cars} drivers={drivers} />
      </div>
    </div>
  );
}

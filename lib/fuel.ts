/**
 * Pure calculation helpers for fuel management. Kept dependency-free (no
 * Mongoose types) so they're easy to reason about and unit-test: everything
 * here just takes plain data in and returns plain data out.
 */

export interface FuelEntryForCalc {
  _id: string;
  car: string; // car id as a plain string, for grouping
  odometerReading: number;
  fuelQuantity: number; // liters
  totalCost: number;
  date: string; // YYYY-MM-DD
}

export interface FuelEntryComputed {
  _id: string;
  distanceKm: number | null; // vs. the previous fill-up for the same car
  kml: number | null; // km per liter for this fill
  isAbnormal: boolean;
  abnormalReason: string | null;
}

// A fill-up's km/l is flagged when it deviates from this car's own average
// (excluding itself) by more than this percentage, in either direction.
export const ABNORMAL_KML_DEVIATION_PERCENT = 25;
// Need at least this many *other* data points for the same car before we'll
// trust an average enough to flag anything against it.
const MIN_HISTORY_FOR_ABNORMAL_CHECK = 2;

/**
 * For every entry, computes the distance covered and km/l since the
 * *previous* fill-up of the same car (ordered by odometer reading), then
 * flags entries whose km/l is an outlier relative to that car's own other
 * fill-ups.
 */
export function computeFuelMetrics(
  entries: FuelEntryForCalc[]
): Map<string, FuelEntryComputed> {
  const byCar = new Map<string, FuelEntryForCalc[]>();
  for (const e of entries) {
    const arr = byCar.get(e.car) ?? [];
    arr.push(e);
    byCar.set(e.car, arr);
  }

  const result = new Map<string, FuelEntryComputed>();

  for (const carEntries of byCar.values()) {
    const sorted = [...carEntries].sort((a, b) => a.odometerReading - b.odometerReading);

    const withKml = sorted.map((entry, i) => {
      if (i === 0) {
        return { entry, distanceKm: null as number | null, kml: null as number | null };
      }
      const distanceKm = entry.odometerReading - sorted[i - 1].odometerReading;
      const kml =
        distanceKm > 0 && entry.fuelQuantity > 0
          ? Number((distanceKm / entry.fuelQuantity).toFixed(2))
          : null;
      return { entry, distanceKm, kml };
    });

    const validIndices = withKml
      .map((row, i) => (row.kml !== null ? i : -1))
      .filter((i) => i !== -1);

    for (const row of withKml) {
      result.set(row.entry._id, {
        _id: row.entry._id,
        distanceKm: row.distanceKm,
        kml: row.kml,
        isAbnormal: false,
        abnormalReason: null,
      });
    }

    for (const i of validIndices) {
      const others = validIndices
        .filter((j) => j !== i)
        .map((j) => withKml[j].kml as number);
      if (others.length < MIN_HISTORY_FOR_ABNORMAL_CHECK) continue;

      const avg = others.reduce((s, v) => s + v, 0) / others.length;
      if (avg <= 0) continue;

      const kml = withKml[i].kml as number;
      const deviationPercent = ((kml - avg) / avg) * 100;
      const computed = result.get(withKml[i].entry._id)!;

      if (deviationPercent <= -ABNORMAL_KML_DEVIATION_PERCENT) {
        computed.isAbnormal = true;
        computed.abnormalReason = `${Math.abs(deviationPercent).toFixed(0)}% worse than this vehicle's usual ${avg.toFixed(1)} km/l — check for leaks, theft, or a driving/route issue`;
      } else if (deviationPercent >= ABNORMAL_KML_DEVIATION_PERCENT) {
        computed.isAbnormal = true;
        computed.abnormalReason = `${deviationPercent.toFixed(0)}% better than this vehicle's usual ${avg.toFixed(1)} km/l — double-check the odometer reading and quantity entered`;
      }
    }
  }

  return result;
}

export interface CarFuelStat {
  carId: string;
  fillCount: number;
  totalLiters: number;
  totalCost: number;
  avgKml: number | null; // distance-weighted average across this car's valid fills
  latestOdometer: number | null;
  abnormalCount: number;
  // Raw components behind avgKml, exposed so callers can combine stats
  // across cars correctly (summing totalLiters * avgKml would double-count
  // the liters from each car's very first fill, which has no distance yet).
  totalDistanceKm: number;
  litersEligibleForKml: number;
}

export function aggregateByCar(
  entries: FuelEntryForCalc[],
  computed: Map<string, FuelEntryComputed>
): CarFuelStat[] {
  const byCar = new Map<string, CarFuelStat>();

  for (const e of entries) {
    const stat =
      byCar.get(e.car) ??
      ({
        carId: e.car,
        fillCount: 0,
        totalLiters: 0,
        totalCost: 0,
        avgKml: null,
        latestOdometer: null,
        abnormalCount: 0,
        totalDistanceKm: 0,
        litersEligibleForKml: 0,
      } satisfies CarFuelStat);

    stat.fillCount += 1;
    stat.totalLiters += e.fuelQuantity;
    stat.totalCost += e.totalCost;
    stat.latestOdometer =
      stat.latestOdometer === null ? e.odometerReading : Math.max(stat.latestOdometer, e.odometerReading);

    const c = computed.get(e._id);
    if (c?.isAbnormal) stat.abnormalCount += 1;
    if (c?.distanceKm != null && c.kml != null) {
      stat.totalDistanceKm += c.distanceKm;
      stat.litersEligibleForKml += e.fuelQuantity;
    }

    byCar.set(e.car, stat);
  }

  for (const stat of byCar.values()) {
    stat.avgKml =
      stat.litersEligibleForKml > 0 ? Number((stat.totalDistanceKm / stat.litersEligibleForKml).toFixed(2)) : null;
    stat.totalLiters = Number(stat.totalLiters.toFixed(2));
    stat.totalCost = Number(stat.totalCost.toFixed(2));
  }

  return [...byCar.values()];
}

export interface MonthlyFuelStat {
  month: string; // YYYY-MM
  fillCount: number;
  totalLiters: number;
  totalCost: number;
}

export function aggregateByMonth(entries: FuelEntryForCalc[]): MonthlyFuelStat[] {
  const byMonth = new Map<string, MonthlyFuelStat>();

  for (const e of entries) {
    const month = e.date.slice(0, 7);
    const stat = byMonth.get(month) ?? { month, fillCount: 0, totalLiters: 0, totalCost: 0 };
    stat.fillCount += 1;
    stat.totalLiters += e.fuelQuantity;
    stat.totalCost += e.totalCost;
    byMonth.set(month, stat);
  }

  return [...byMonth.values()]
    .map((s) => ({ ...s, totalLiters: Number(s.totalLiters.toFixed(2)), totalCost: Number(s.totalCost.toFixed(2)) }))
    .sort((a, b) => (a.month < b.month ? 1 : -1));
}

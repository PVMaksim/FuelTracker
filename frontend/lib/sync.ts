import { type LocalRefuel, getUnsyncedRefuels, markSynced, saveRefuelLocally, getLastOdometer } from "./db";
import { api } from "./api";
import { calculateLiters, calculateConsumption, calculateDistance, calculateCostPerKm } from "./calculations";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export interface SaveRefuelInput {
  odometer: number;
  fuelPrice: number;
  totalCost: number;
  fuelType?: string;
  carId?: string;
  notes?: string;
}

export async function saveRefuel(input: SaveRefuelInput): Promise<LocalRefuel> {
  const lastOdometer = await getLastOdometer();
  const liters      = calculateLiters(input.totalCost, input.fuelPrice);
  const distance    = calculateDistance(input.odometer, lastOdometer);
  const consumption = distance ? calculateConsumption(liters, distance) : undefined;
  const costPerKm   = distance ? calculateCostPerKm(input.totalCost, distance) : undefined;

  const localRefuel: LocalRefuel = {
    localId: generateId(),
    isSynced: false,
    createdAt: new Date().toISOString(),
    odometer: input.odometer,
    fuelPrice: input.fuelPrice,
    totalCost: input.totalCost,
    fuelType: input.fuelType,
    carId: input.carId,
    liters, distance, consumption, costPerKm,
    notes: input.notes,
  };

  await saveRefuelLocally(localRefuel);

  if (navigator.onLine) {
    try {
      const serverRefuel = await api.createRefuel({
        odometer:   localRefuel.odometer,
        fuel_price: localRefuel.fuelPrice,
        total_cost: localRefuel.totalCost,
        car_id:     localRefuel.carId,
        fuel_type:  localRefuel.fuelType,
        local_id:   localRefuel.localId,
        notes:      localRefuel.notes,
        created_at: localRefuel.createdAt,
      });
      await markSynced(localRefuel.localId, serverRefuel.id);
      return { ...localRefuel, isSynced: true, serverId: serverRefuel.id };
    } catch (e) {
      console.warn("[sync] Immediate sync failed:", e);
    }
  }
  return localRefuel;
}

export async function syncPendingRefuels(): Promise<number> {
  const unsynced = await getUnsyncedRefuels();
  if (unsynced.length === 0) return 0;
  try {
    const results = await api.bulkSync(unsynced.map(r => ({
      odometer: r.odometer, fuel_price: r.fuelPrice, total_cost: r.totalCost,
      car_id: r.carId ?? null, fuel_type: r.fuelType ?? null,
      local_id: r.localId, notes: r.notes ?? null, created_at: r.createdAt,
    })));
    let synced = 0;
    for (const result of results) {
      if (result.status === "created" && result.server_id && result.local_id) {
        await markSynced(result.local_id, result.server_id);
        synced++;
      }
    }
    return synced;
  } catch { return 0; }
}

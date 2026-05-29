/**
 * IndexedDB schema and operations via Dexie.js.
 * Офлайн-хранилище заправок в браузере.
 */
import Dexie, { type Table } from "dexie";

export interface LocalRefuel {
  localId: string;
  serverId?: string;
  isSynced: boolean;
  createdAt: string;
  odometer: number;
  fuelPrice: number;
  totalCost: number;
  liters: number;
  distance?: number;
  consumption?: number;
  costPerKm?: number;
  fuelType?: string;
  carId?: string;
  notes?: string;
}

class FuelTrackerDB extends Dexie {
  refuels!: Table<LocalRefuel>;
  constructor() {
    super("FuelTrackerDB");
    this.version(2).stores({
      refuels: "localId, isSynced, createdAt, odometer",
    });
  }
}

export const db = new FuelTrackerDB();

export async function getAllRefuels(): Promise<LocalRefuel[]> {
  return db.refuels.orderBy("createdAt").reverse().toArray();
}

export async function getLastOdometer(): Promise<number | null> {
  const last = await db.refuels.orderBy("odometer").last();
  return last?.odometer ?? null;
}

export async function getLastFuelPrice(): Promise<number | null> {
  const last = await db.refuels.orderBy("createdAt").last();
  return last?.fuelPrice ?? null;
}

export async function saveRefuelLocally(refuel: LocalRefuel): Promise<void> {
  await db.refuels.put(refuel);
}

export async function markSynced(localId: string, serverId: string): Promise<void> {
  await db.refuels.update(localId, { isSynced: true, serverId });
}

export async function getUnsyncedRefuels(): Promise<LocalRefuel[]> {
  return db.refuels.where("isSynced").equals(0).toArray();
}

export async function deleteLocalRefuel(localId: string): Promise<void> {
  await db.refuels.delete(localId);
}

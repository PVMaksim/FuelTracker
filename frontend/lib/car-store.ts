/**
 * Car selection storage.
 * Хранит выбранный автомобиль в localStorage.
 */

const KEY = "selected_car_id";

export function getSelectedCarId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(KEY);
}

export function setSelectedCarId(id: string): void {
  localStorage.setItem(KEY, id);
}

export function clearSelectedCarId(): void {
  localStorage.removeItem(KEY);
}

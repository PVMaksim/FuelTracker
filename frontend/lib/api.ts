/**
 * API client for FuelTracker backend.
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8090/api/v1";
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "8pL8";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
      ...options.headers,
    },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Неизвестная ошибка" }));
    throw new Error(error.detail ?? `HTTP ${response.status}`);
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}

export interface CarResponse {
  id: string;
  name: string;
  initial_odometer: number;
  last_fuel_type: string | null;
  created_at: string;
}

export interface RefuelResponse {
  id: string;
  created_at: string;
  car_id: string | null;
  odometer: number;
  fuel_price: number;
  total_cost: number;
  liters: number;
  distance: number | null;
  consumption: number | null;
  cost_per_km: number | null;
  fuel_type: string | null;
  local_id: string | null;
  notes: string | null;
}

export interface StatsResponse {
  total_refuels: number;
  total_cost: number;
  total_liters: number;
  avg_consumption: number | null;
  avg_consumption_30d: number | null;
  last_odometer: number | null;
  last_fuel_price: number | null;
  chart_data: { date: string; consumption: number; odometer: number }[];
  monthly_data: { month: string; total_cost: number; total_liters: number; avg_consumption: number | null }[];
}

export interface OCRResult {
  total_cost: number | null;
  liters: number | null;
  price_per_liter: number | null;
  station: string | null;
}

export const api = {
  // Cars
  getCars: () => request<CarResponse[]>("/cars"),
  createCar: (data: { name: string; initial_odometer?: number }) =>
    request<CarResponse>("/cars", { method: "POST", body: JSON.stringify(data) }),
  updateCar: (id: string, data: { name?: string; initial_odometer?: number; last_fuel_type?: string }) =>
    request<CarResponse>(`/cars/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteCar: (id: string) => request<void>(`/cars/${id}`, { method: "DELETE" }),

  // Refuels
  getRefuels: (limit = 100, carId?: string) => {
    const q = carId ? `?limit=${limit}&car_id=${carId}` : `?limit=${limit}`;
    return request<RefuelResponse[]>(`/refuels${q}`);
  },
  createRefuel: (data: {
    odometer: number; fuel_price: number; total_cost: number;
    car_id?: string; fuel_type?: string; local_id?: string;
    notes?: string; created_at?: string;
  }) => request<RefuelResponse>("/refuels", { method: "POST", body: JSON.stringify(data) }),
  updateRefuel: (id: string, data: {
    odometer?: number; fuel_price?: number; total_cost?: number;
    fuel_type?: string; notes?: string;
  }) => request<RefuelResponse>(`/refuels/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  bulkSync: (items: object[]) =>
    request<{ local_id: string; server_id?: string; status: string }[]>(
      "/refuels/bulk", { method: "POST", body: JSON.stringify(items) }
    ),
  deleteRefuel: (id: string) => request<void>(`/refuels/${id}`, { method: "DELETE" }),

  // Stats
  getStats: (carId?: string) => {
    const q = carId ? `?car_id=${carId}` : "";
    return request<StatsResponse>(`/stats${q}`);
  },

  // OCR
  analyzeReceipt: async (file: File): Promise<OCRResult> => {
    const form = new FormData();
    form.append("file", file);
    const response = await fetch(`${API_URL}/ocr/receipt`, {
      method: "POST", headers: { "x-api-key": API_KEY }, body: form,
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "OCR ошибка" }));
      throw new Error(error.detail);
    }
    return response.json();
  },

  // Expenses
  getExpenses: (carId?: string, filter?: string) => {
    const params = new URLSearchParams();
    if (carId) params.set("car_id", carId);
    if (filter) params.set("filter", filter);
    const q = params.toString();
    return request<any[]>(`/expenses${q ? "?" + q : ""}`);
  },
  createExpense: (data: { amount: number; category: string; description?: string; notes?: string; car_id?: string; created_at?: string; is_part?: boolean; }) => request<any>("/expenses", { method: "POST", body: JSON.stringify(data) }),
  deleteExpense: (id: string) => request<void>(`/expenses/${id}`, { method: "DELETE" }),
  bulkCreateExpenses: (data: { items: any[]; car_id?: string }) =>
    request<any[]>("/expenses/bulk", { method: "POST", body: JSON.stringify(data) }),
  analyzeRepairReceipt: async (file: File) => {
    const form = new FormData();
    form.append("file", file);
    const API_URL2 = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8090/api/v1";
    const API_KEY2 = process.env.NEXT_PUBLIC_API_KEY || "";
    const response = await fetch(`${API_URL2}/ocr/repair`, {
      method: "POST", headers: { "x-api-key": API_KEY2 }, body: form,
    });
    if (!response.ok) throw new Error("Ошибка OCR");
    return response.json();
  },
  getExpenseStats: (carId?: string) =>
    request<{ total: number; total_parts: number; total_labor: number; total_other: number }>(
      `/expenses/stats${carId ? `?car_id=${carId}` : ""}`
    ),

  exportCsv:  (carId?: string) => `${API_URL}/refuels/export/csv?api_key=${API_KEY}${carId ? `&car_id=${carId}` : ""}`,
  exportXlsx: (carId?: string) => `${API_URL}/refuels/export/xlsx?api_key=${API_KEY}${carId ? `&car_id=${carId}` : ""}`,
};

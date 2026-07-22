import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import type {
  vehicles,
  trips,
  fuelEntries,
  expenses,
  incomeEntries,
} from '@db/schema';

// ─── Entity Types (DB rows) ────────────────────────────────────────────────────

export type Vehicle = InferSelectModel<typeof vehicles>;
export type Trip = InferSelectModel<typeof trips>;
export type FuelEntry = InferSelectModel<typeof fuelEntries>;
export type Expense = InferSelectModel<typeof expenses>;
export type IncomeEntry = InferSelectModel<typeof incomeEntries>;

// ─── Insert Types (new records) ───────────────────────────────────────────────

export type NewVehicle = InferInsertModel<typeof vehicles>;
export type NewTrip = InferInsertModel<typeof trips>;
export type NewFuelEntry = InferInsertModel<typeof fuelEntries>;
export type NewExpense = InferInsertModel<typeof expenses>;
export type NewIncomeEntry = InferInsertModel<typeof incomeEntries>;

// ─── Enum Unions ──────────────────────────────────────────────────────────────

export type VehicleType = 'car' | 'motorcycle' | 'truck' | 'van';
export type FuelType = 'gasoline' | 'diesel' | 'electric' | 'lpg';
export type TripStatus = 'active' | 'completed' | 'cancelled';
export type ExpenseCategory =
  | 'bridge'
  | 'parking'
  | 'maintenance'
  | 'fine'
  | 'tire'
  | 'wash'
  | 'other';
export type IncomeSource = 'trip' | 'bonus' | 'other';

// ─── Stats Types ──────────────────────────────────────────────────────────────

export interface DailyStats {
  date: number; // Unix timestamp (start of day)
  totalEarnings: number;
  totalFuelCost: number;
  totalExpenses: number;
  netEarnings: number;
  totalTrips: number;
  completedTrips: number;
  totalKm: number;
  fuelCostPerKm: number;
}

export interface PeriodStats {
  startDate: number;
  endDate: number;
  totalEarnings: number;
  totalFuelCost: number;
  totalExpenses: number;
  netEarnings: number;
  totalTrips: number;
  completedTrips: number;
  totalKm: number;
  fuelCostPerKm: number;
  avgDailyEarnings: number;
  avgTripEarnings: number;
  avgTripDistanceKm: number;
}

export interface TripDuration {
  hours: number;
  minutes: number;
  display: string; // e.g. "2s 30dk"
}

// ─── UI Helper Types ──────────────────────────────────────────────────────────

export interface SelectOption {
  label: string;
  value: string;
}

export const VEHICLE_TYPE_OPTIONS: SelectOption[] = [
  { label: 'Araba', value: 'car' },
  { label: 'Motosiklet', value: 'motorcycle' },
  { label: 'Kamyon', value: 'truck' },
  { label: 'Van', value: 'van' },
];

export const FUEL_TYPE_OPTIONS: SelectOption[] = [
  { label: 'Benzin', value: 'gasoline' },
  { label: 'Dizel', value: 'diesel' },
  { label: 'Elektrik', value: 'electric' },
  { label: 'LPG', value: 'lpg' },
];

export const EXPENSE_CATEGORY_OPTIONS: SelectOption[] = [
  { label: 'Köprü/Otoyol', value: 'bridge' },
  { label: 'Otopark', value: 'parking' },
  { label: 'Bakım/Tamir', value: 'maintenance' },
  { label: 'Ceza', value: 'fine' },
  { label: 'Lastik', value: 'tire' },
  { label: 'Yıkama', value: 'wash' },
  { label: 'Diğer', value: 'other' },
];

export const INCOME_SOURCE_OPTIONS: SelectOption[] = [
  { label: 'Sefer', value: 'trip' },
  { label: 'Bonus', value: 'bonus' },
  { label: 'Diğer', value: 'other' },
];

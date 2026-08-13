import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import type {
  vehicles,
  trips,
  fuelEntries,
  expenses,
  incomeEntries,
  daySessions,
} from '@db/schema';

// ─── Entity Types (DB rows) ────────────────────────────────────────────────────

export type Vehicle = InferSelectModel<typeof vehicles>;
export type Trip = InferSelectModel<typeof trips>;
export type FuelEntry = InferSelectModel<typeof fuelEntries>;
export type Expense = InferSelectModel<typeof expenses>;
export type IncomeEntry = InferSelectModel<typeof incomeEntries>;
export type DaySession = InferSelectModel<typeof daySessions>;

// ─── Insert Types (new records) ───────────────────────────────────────────────

export type NewVehicle = InferInsertModel<typeof vehicles>;
export type NewTrip = InferInsertModel<typeof trips>;
export type NewFuelEntry = InferInsertModel<typeof fuelEntries>;
export type NewExpense = InferInsertModel<typeof expenses>;
export type NewIncomeEntry = InferInsertModel<typeof incomeEntries>;
export type NewDaySession = InferInsertModel<typeof daySessions>;

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

// Çeviriye duyarlı seçenek listeleri için bkz. @/i18n/options
// (useVehicleTypeOptions, useFuelTypeOptions, useExpenseCategoryOptions,
// useIncomeSourceOptions).

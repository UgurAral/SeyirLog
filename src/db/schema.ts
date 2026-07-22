import {
  integer,
  real,
  sqliteTable,
  text,
} from 'drizzle-orm/sqlite-core';

// ─── vehicles ──────────────────────────────────────────────────────────────────

export const vehicles = sqliteTable('vehicles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  brand: text('brand').notNull(),
  model: text('model').notNull(),
  year: integer('year'),
  plate: text('plate'),
  type: text('type', { enum: ['car', 'motorcycle', 'truck', 'van'] })
    .notNull()
    .default('car'),
  fuelType: text('fuel_type', {
    enum: ['gasoline', 'diesel', 'electric', 'lpg'],
  })
    .notNull()
    .default('gasoline'),
  isActive: integer('is_active').notNull().default(1),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

// ─── trips ─────────────────────────────────────────────────────────────────────

export const trips = sqliteTable('trips', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  vehicleId: integer('vehicle_id').references(() => vehicles.id),
  origin: text('origin').notNull(),
  destination: text('destination').notNull(),
  startKm: real('start_km').notNull(),
  endKm: real('end_km'),
  distanceKm: real('distance_km'),
  startTime: integer('start_time').notNull(),
  endTime: integer('end_time'),
  durationMinutes: integer('duration_minutes'),
  earnings: real('earnings'),
  notes: text('notes'),
  status: text('status', { enum: ['active', 'completed', 'cancelled'] })
    .notNull()
    .default('active'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

// ─── fuel_entries ──────────────────────────────────────────────────────────────

export const fuelEntries = sqliteTable('fuel_entries', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  vehicleId: integer('vehicle_id').references(() => vehicles.id),
  liters: real('liters').notNull(),
  pricePerLiter: real('price_per_liter').notNull(),
  totalCost: real('total_cost').notNull(),
  currentKm: real('current_km'),
  stationName: text('station_name'),
  date: integer('date').notNull(),
  notes: text('notes'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

// ─── expenses ──────────────────────────────────────────────────────────────────

export const expenses = sqliteTable('expenses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  vehicleId: integer('vehicle_id').references(() => vehicles.id),
  tripId: integer('trip_id').references(() => trips.id),
  category: text('category', {
    enum: ['bridge', 'parking', 'maintenance', 'fine', 'tire', 'wash', 'other'],
  }).notNull(),
  amount: real('amount').notNull(),
  description: text('description'),
  date: integer('date').notNull(),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

// ─── income_entries ────────────────────────────────────────────────────────────

export const incomeEntries = sqliteTable('income_entries', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  vehicleId: integer('vehicle_id').references(() => vehicles.id),
  amount: real('amount').notNull(),
  source: text('source', { enum: ['trip', 'bonus', 'other'] }),
  description: text('description'),
  date: integer('date').notNull(),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

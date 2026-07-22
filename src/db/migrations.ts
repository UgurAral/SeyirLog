// src/db/migrations.ts
// Manual SQL migration bundle for drizzle-orm/expo-sqlite migrator.
// Oluşturulma: FAZ 2 — tablo yapısı FAZ 1 schema.ts ile eşleşir.

const migrations = {
  journal: {
    version: '5',
    dialect: 'sqlite',
    entries: [
      {
        idx: 0,
        version: '0001',
        when: 1700000000000,
        tag: '0001_initial',
        breakpoints: true,
      },
    ],
  },
  migrations: {
    '0001_initial': `
      CREATE TABLE IF NOT EXISTS vehicles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        brand TEXT NOT NULL,
        model TEXT NOT NULL,
        year INTEGER,
        plate TEXT,
        type TEXT NOT NULL DEFAULT 'car',
        fuel_type TEXT NOT NULL DEFAULT 'gasoline',
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS trips (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vehicle_id INTEGER REFERENCES vehicles(id),
        origin TEXT NOT NULL,
        destination TEXT NOT NULL,
        start_km REAL NOT NULL,
        end_km REAL,
        distance_km REAL,
        start_time INTEGER NOT NULL,
        end_time INTEGER,
        duration_minutes INTEGER,
        earnings REAL,
        notes TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS fuel_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vehicle_id INTEGER REFERENCES vehicles(id),
        liters REAL NOT NULL,
        price_per_liter REAL NOT NULL,
        total_cost REAL NOT NULL,
        current_km REAL,
        station_name TEXT,
        date INTEGER NOT NULL,
        notes TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vehicle_id INTEGER REFERENCES vehicles(id),
        trip_id INTEGER REFERENCES trips(id),
        category TEXT NOT NULL,
        amount REAL NOT NULL,
        description TEXT,
        date INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS income_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vehicle_id INTEGER REFERENCES vehicles(id),
        amount REAL NOT NULL,
        source TEXT,
        description TEXT,
        date INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `,
  },
} as const;

export default migrations;

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
      {
        idx: 1,
        version: '0001',
        when: 1753800000000,
        tag: '0002_fix_missing_tables',
        breakpoints: true,
      },
      {
        idx: 2,
        version: '0001',
        when: 1753900000000,
        tag: '0003_trip_start_km_nullable',
        breakpoints: true,
      },
      {
        idx: 3,
        version: '0001',
        when: 1754000000000,
        tag: '0004_add_currency_column',
        breakpoints: true,
      },
      {
        idx: 4,
        version: '0001',
        when: 1754100000000,
        tag: '0005_add_day_sessions',
        breakpoints: true,
      },
    ],
  },
  migrations: {
    // NOT: bu statement'lar `--> statement-breakpoint` ile ayrılmalı — migrator
    // (drizzle-orm/expo-sqlite/migrator.js) bu işarete göre böler ve her parçayı
    // ayrı çalıştırır. Ayraç olmadan tüm blok tek bir statement sayılır ve
    // expo-sqlite yalnızca ilkini (vehicles) çalıştırıp gerisini sessizce yok
    // sayar — trips/fuel_entries/expenses/income_entries hiç oluşmaz.
    m0000: `
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
      --> statement-breakpoint
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
      --> statement-breakpoint
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
      --> statement-breakpoint
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
      --> statement-breakpoint
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
    // Bu migration, m0000'ın ayraçsız haliyle zaten "uygulandı" işaretlenmiş
    // ama sadece vehicles'ı oluşturmuş cihazları da onarır (IF NOT EXISTS ile
    // idempotent) — hem bizim test cihazımız hem gerçek erken kullanıcılar için.
    m0001: `
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
      --> statement-breakpoint
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
      --> statement-breakpoint
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
      --> statement-breakpoint
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
    // Sefer ekranında artık başlangıç/bitiş km yerine doğrudan "mesafe" isteniyor
    // — start_km bu yüzden zorunlu olmaktan çıkarılıyor. SQLite ALTER COLUMN
    // desteklemediği için klasik "tabloyu yeniden oluştur" yöntemi kullanılıyor.
    m0002: `
      CREATE TABLE trips_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vehicle_id INTEGER REFERENCES vehicles(id),
        origin TEXT NOT NULL,
        destination TEXT NOT NULL,
        start_km REAL,
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
      --> statement-breakpoint
      INSERT INTO trips_new SELECT * FROM trips;
      --> statement-breakpoint
      DROP TABLE trips;
      --> statement-breakpoint
      ALTER TABLE trips_new RENAME TO trips;
    `,
    // Çoklu para birimi desteği — her para hareketinin girildiği anda geçerli
    // olan global para birimi bu sütunda saklanır. Var olan kayıtlar TRY
    // varsayımıyla (uygulamanın önceki tek para birimi) dolduruluyor.
    m0003: `
      ALTER TABLE trips ADD COLUMN currency TEXT NOT NULL DEFAULT 'TRY';
      --> statement-breakpoint
      ALTER TABLE fuel_entries ADD COLUMN currency TEXT NOT NULL DEFAULT 'TRY';
      --> statement-breakpoint
      ALTER TABLE expenses ADD COLUMN currency TEXT NOT NULL DEFAULT 'TRY';
      --> statement-breakpoint
      ALTER TABLE income_entries ADD COLUMN currency TEXT NOT NULL DEFAULT 'TRY';
    `,
    // "Günü Başlat/Bitir" vardiyaları artık SQLite'ta kalıcı — başlangıç/bitiş
    // km'leri sefer dışı sürüşü de kapsayan gerçek toplam mesafeyi hesaplamak
    // için sonradan da girilebilecek şekilde nullable.
    m0004: `
      CREATE TABLE IF NOT EXISTS day_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vehicle_id INTEGER REFERENCES vehicles(id),
        start_time INTEGER NOT NULL,
        end_time INTEGER,
        start_odometer_km REAL,
        end_odometer_km REAL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `,
  },
};

export default migrations;

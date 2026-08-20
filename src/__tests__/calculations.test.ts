/**
 * src/__tests__/calculations.test.ts
 *
 * calculateNetEarnings, calculateFuelCostPerKm ve calculateTripDuration
 * fonksiyonları için birim testleri.
 */

import {
  calculateNetEarnings,
  calculateFuelCostPerKm,
  calculateTripDuration,
  resolveTripDurationMinutes,
  calculateDailyStats,
  calculatePeriodStats,
  sumByCurrency,
} from '../utils/calculations';
import type { Trip, FuelEntry, Expense } from '../types';

// ─── calculateNetEarnings ─────────────────────────────────────────────────────

describe('calculateNetEarnings', () => {
  it('pozitif değerlerle doğru net kazancı hesaplar', () => {
    expect(calculateNetEarnings(1000, 200, 100)).toBe(700);
  });

  it('kazanç 0 olduğunda negatif döner (giderler var)', () => {
    expect(calculateNetEarnings(0, 200, 100)).toBe(-300);
  });

  it('tüm değerler 0 olduğunda 0 döner', () => {
    expect(calculateNetEarnings(0, 0, 0)).toBe(0);
  });

  it('yakıt maliyeti kazançtan büyükse negatif döner', () => {
    expect(calculateNetEarnings(500, 600, 0)).toBe(-100);
  });

  it('büyük değerlerle doğru hesaplama yapar', () => {
    expect(calculateNetEarnings(50000, 12500, 7500)).toBe(30000);
  });

  it('ondalıklı değerlerle çalışır', () => {
    expect(calculateNetEarnings(1234.56, 234.56, 100)).toBeCloseTo(900, 5);
  });

  it('negatif kazanç değeriyle de doğru çalışır', () => {
    // Nadir ama mantıksal — girdi doğrulaması ekrana ait
    expect(calculateNetEarnings(-100, 50, 50)).toBe(-200);
  });
});

// ─── calculateFuelCostPerKm ───────────────────────────────────────────────────

describe('calculateFuelCostPerKm', () => {
  it('normal değerlerle km başına maliyeti hesaplar', () => {
    expect(calculateFuelCostPerKm(500, 250)).toBe(2);
  });

  it('totalKm 0 ise 0 döner (sıfıra bölme koruması)', () => {
    expect(calculateFuelCostPerKm(500, 0)).toBe(0);
  });

  it('totalKm negatif ise 0 döner', () => {
    expect(calculateFuelCostPerKm(500, -100)).toBe(0);
  });

  it('yakıt maliyeti 0 ise 0 döner', () => {
    expect(calculateFuelCostPerKm(0, 300)).toBe(0);
  });

  it('küçük mesafe büyük maliyet', () => {
    expect(calculateFuelCostPerKm(1000, 10)).toBe(100);
  });

  it('ondalıklı değerlerle doğru çalışır', () => {
    expect(calculateFuelCostPerKm(333.33, 111.11)).toBeCloseTo(3, 1);
  });

  it('gerçekçi örnek: 600₺ yakıt / 300km', () => {
    expect(calculateFuelCostPerKm(600, 300)).toBe(2);
  });
});

// ─── calculateTripDuration ────────────────────────────────────────────────────

describe('calculateTripDuration', () => {
  const BASE = 1700000000; // sabit başlangıç timestamp'i

  it('1 saat 30 dakika doğru hesaplar', () => {
    const result = calculateTripDuration(BASE, BASE + 90 * 60);
    expect(result.hours).toBe(1);
    expect(result.minutes).toBe(30);
    expect(result.display).toBe('1s 30dk');
  });

  it('sadece saat (tam saat)', () => {
    const result = calculateTripDuration(BASE, BASE + 2 * 3600);
    expect(result.hours).toBe(2);
    expect(result.minutes).toBe(0);
    expect(result.display).toBe('2s');
  });

  it('sadece dakika (1 saatten az)', () => {
    const result = calculateTripDuration(BASE, BASE + 45 * 60);
    expect(result.hours).toBe(0);
    expect(result.minutes).toBe(45);
    expect(result.display).toBe('45dk');
  });

  it('0 dakika (aynı zaman damgaları)', () => {
    const result = calculateTripDuration(BASE, BASE);
    expect(result.hours).toBe(0);
    expect(result.minutes).toBe(0);
    expect(result.display).toBe('0dk');
  });

  it('negatif süre (endTime < startTime) → 0 döner', () => {
    const result = calculateTripDuration(BASE + 100, BASE);
    expect(result.hours).toBe(0);
    expect(result.minutes).toBe(0);
    expect(result.display).toBe('0dk');
  });

  it('çok uzun sefer: 8 saat 15 dakika', () => {
    const result = calculateTripDuration(BASE, BASE + (8 * 3600 + 15 * 60));
    expect(result.hours).toBe(8);
    expect(result.minutes).toBe(15);
    expect(result.display).toBe('8s 15dk');
  });

  it('tam 3 saat', () => {
    const result = calculateTripDuration(BASE, BASE + 3 * 3600);
    expect(result.hours).toBe(3);
    expect(result.minutes).toBe(0);
    expect(result.display).toBe('3s');
  });

  it('1 dakika', () => {
    const result = calculateTripDuration(BASE, BASE + 60);
    expect(result.hours).toBe(0);
    expect(result.minutes).toBe(1);
    expect(result.display).toBe('1dk');
  });
});

// ─── resolveTripDurationMinutes ───────────────────────────────────────────────

describe('resolveTripDurationMinutes', () => {
  it('kayıtlı durationMinutes varsa onu döner (canlı hesaplamayı atlar)', () => {
    expect(
      resolveTripDurationMinutes({ startTime: 0, endTime: 1000, durationMinutes: 42 }),
    ).toBe(42);
  });

  it('durationMinutes yok ama endTime varsa canlı hesaplar', () => {
    expect(
      resolveTripDurationMinutes({ startTime: 1000, endTime: 1000 + 90 * 60, durationMinutes: null }),
    ).toBe(90);
  });

  it('sefer hâlâ aktifse (endTime null) null döner', () => {
    expect(
      resolveTripDurationMinutes({ startTime: 1000, endTime: null, durationMinutes: null }),
    ).toBeNull();
  });

  it('durationMinutes 0 ise (falsy ama geçerli) yine de 0 döner, canlı hesaplamaya düşmez', () => {
    expect(
      resolveTripDurationMinutes({ startTime: 0, endTime: 1000, durationMinutes: 0 }),
    ).toBe(0);
  });
});

// ─── calculateDailyStats / calculatePeriodStats / sumByCurrency ──────────────

function makeTrip(overrides: Partial<Trip> = {}): Trip {
  return {
    id: 1,
    vehicleId: 1,
    origin: 'A',
    destination: 'B',
    startKm: null,
    endKm: null,
    distanceKm: 10,
    startTime: 1704067200, // 2024-01-01T00:00:00Z
    endTime: 1704070800,
    durationMinutes: 60,
    earnings: 100,
    currency: 'TRY',
    notes: null,
    status: 'completed',
    createdAt: 1704067200,
    updatedAt: 1704067200,
    ...overrides,
  };
}

function makeFuelEntry(overrides: Partial<FuelEntry> = {}): FuelEntry {
  return {
    id: 1,
    vehicleId: 1,
    liters: 10,
    pricePerLiter: 5,
    totalCost: 50,
    currency: 'TRY',
    currentKm: null,
    stationName: null,
    date: 1704067200,
    notes: null,
    createdAt: 1704067200,
    updatedAt: 1704067200,
    ...overrides,
  };
}

function makeExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: 1,
    vehicleId: 1,
    tripId: null,
    category: 'other',
    amount: 20,
    currency: 'TRY',
    description: null,
    date: 1704067200,
    createdAt: 1704067200,
    updatedAt: 1704067200,
    ...overrides,
  };
}

describe('calculateDailyStats', () => {
  const DAY_START = 1704067200; // 2024-01-01T00:00:00Z

  it('gün içindeki tamamlanmış seferleri, yakıtı ve giderleri toplar', () => {
    const stats = calculateDailyStats(
      [makeTrip({ earnings: 100, distanceKm: 10, status: 'completed', startTime: DAY_START + 3600 })],
      [makeFuelEntry({ totalCost: 50, date: DAY_START + 3600 })],
      [makeExpense({ amount: 20, date: DAY_START + 3600 })],
      DAY_START,
    );
    expect(stats.totalEarnings).toBe(100);
    expect(stats.totalFuelCost).toBe(50);
    expect(stats.totalExpenses).toBe(20);
    expect(stats.netEarnings).toBe(30);
    expect(stats.totalTrips).toBe(1);
    expect(stats.completedTrips).toBe(1);
    expect(stats.totalKm).toBe(10);
  });

  it('gün sınırları dışındaki kayıtları hariç tutar', () => {
    const stats = calculateDailyStats(
      [makeTrip({ earnings: 100, startTime: DAY_START - 1 })], // önceki gün
      [makeFuelEntry({ totalCost: 50, date: DAY_START + 86400 })], // sonraki gün
      [],
      DAY_START,
    );
    expect(stats.totalTrips).toBe(0);
    expect(stats.totalFuelCost).toBe(0);
  });

  it('aktif (tamamlanmamış) seferi kazanç/km toplamına katmaz ama totalTrips sayar', () => {
    const stats = calculateDailyStats(
      [makeTrip({ status: 'active', earnings: null, distanceKm: null, startTime: DAY_START + 100 })],
      [],
      [],
      DAY_START,
    );
    expect(stats.totalTrips).toBe(1);
    expect(stats.completedTrips).toBe(0);
    expect(stats.totalEarnings).toBe(0);
    expect(stats.totalKm).toBe(0);
  });

  it('boş girdilerle sıfır istatistik döner', () => {
    const stats = calculateDailyStats([], [], [], DAY_START);
    expect(stats.totalTrips).toBe(0);
    expect(stats.netEarnings).toBe(0);
    expect(stats.fuelCostPerKm).toBe(0);
  });
});

describe('calculatePeriodStats', () => {
  const START = 1704067200; // 2024-01-01
  const END = 1704067200 + 7 * 86400; // +7 gün

  it('dönem içindeki tamamlanmış seferleri toplar ve ortalamaları hesaplar', () => {
    const stats = calculatePeriodStats(
      [
        makeTrip({ earnings: 100, distanceKm: 10, startTime: START + 3600 }),
        makeTrip({ earnings: 200, distanceKm: 20, startTime: START + 7200 }),
      ],
      [makeFuelEntry({ totalCost: 60, date: START + 3600 })],
      [makeExpense({ amount: 40, date: START + 3600 })],
      START,
      END,
    );
    expect(stats.totalEarnings).toBe(300);
    expect(stats.completedTrips).toBe(2);
    expect(stats.avgTripEarnings).toBe(150);
    expect(stats.avgTripDistanceKm).toBe(15);
    expect(stats.netEarnings).toBe(200); // 300 - 60 - 40
  });

  it('dönem dışındaki kayıtları hariç tutar', () => {
    const stats = calculatePeriodStats(
      [makeTrip({ earnings: 100, startTime: END + 1 })],
      [],
      [],
      START,
      END,
    );
    expect(stats.totalTrips).toBe(0);
  });

  it('tamamlanmış sefer yoksa ortalamalar 0 döner (0/0 değil)', () => {
    const stats = calculatePeriodStats([], [], [], START, END);
    expect(stats.avgTripEarnings).toBe(0);
    expect(stats.avgTripDistanceKm).toBe(0);
    expect(stats.avgDailyEarnings).toBe(0);
  });

  it('avgDailyEarnings gün sayısına bölerek hesaplar (min 1 gün)', () => {
    const stats = calculatePeriodStats(
      [makeTrip({ earnings: 700, startTime: START })],
      [],
      [],
      START,
      START, // aynı gün, 0 saniyelik aralık → min 1 gün varsayılmalı
    );
    expect(stats.avgDailyEarnings).toBe(700);
  });
});

describe('sumByCurrency', () => {
  it('kayıtları para birimine göre gruplayıp toplar', () => {
    const rows = [
      { currency: 'TRY', amount: 100 },
      { currency: 'USD', amount: 10 },
      { currency: 'TRY', amount: 50 },
    ];
    expect(sumByCurrency(rows, (r) => r.amount)).toEqual({ TRY: 150, USD: 10 });
  });

  it('currency alanı null/undefined ise TRY varsayar', () => {
    const rows = [{ currency: null, amount: 30 }, { currency: undefined, amount: 20 }];
    expect(sumByCurrency(rows, (r) => r.amount)).toEqual({ TRY: 50 });
  });

  it('farklı para birimlerini birbirine dönüştürmez, ayrı tutar', () => {
    const rows = [
      { currency: 'USD', amount: 10 },
      { currency: 'EUR', amount: 10 },
    ];
    expect(sumByCurrency(rows, (r) => r.amount)).toEqual({ USD: 10, EUR: 10 });
  });

  it('boş dizi için boş obje döner', () => {
    expect(sumByCurrency([], (r: { amount: number }) => r.amount)).toEqual({});
  });
});

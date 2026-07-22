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
} from '../utils/calculations';

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

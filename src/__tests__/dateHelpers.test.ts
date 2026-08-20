/**
 * src/__tests__/dateHelpers.test.ts
 *
 * getStartOfDay, isInPeriod ve getIstanbulDateParts fonksiyonları için
 * birim testleri. Tüm sınırlar İstanbul saatine (+3, DST yok) göre.
 */

import { getStartOfDay, isInPeriod, getIstanbulDateParts } from '../utils/dateHelpers';

// ─── getStartOfDay ─────────────────────────────────────────────────────────────

describe('getStartOfDay', () => {
  it('UTC gece yarısını İstanbul saatiyle aynı günün başına döner', () => {
    // 2024-01-15T00:00:00Z → Istanbul 2024-01-15 03:00 → günün başı 2024-01-15T00:00 Istanbul = 2024-01-14T21:00Z
    const d = new Date('2024-01-15T00:00:00Z');
    const start = getStartOfDay(d);
    expect(start).toBe(Math.floor(new Date('2024-01-14T21:00:00Z').getTime() / 1000));
  });

  it('İstanbul saatiyle gece yarısından hemen önceki an, bir önceki güne düşer', () => {
    // 2024-01-14T20:59:59Z → Istanbul saatiyle hâlâ 2024-01-14 23:59:59
    const d = new Date('2024-01-14T20:59:59Z');
    const start = getStartOfDay(d);
    expect(start).toBe(Math.floor(new Date('2024-01-13T21:00:00Z').getTime() / 1000));
  });

  it('İstanbul saatiyle gece yarısından hemen sonraki an, yeni güne düşer', () => {
    // 2024-01-14T21:00:00Z → Istanbul saatiyle tam 2024-01-15 00:00:00
    const d = new Date('2024-01-14T21:00:00Z');
    const start = getStartOfDay(d);
    expect(start).toBe(Math.floor(d.getTime() / 1000));
  });

  it('aynı İstanbul günü içindeki farklı saatler için aynı sonucu döner', () => {
    const morning = getStartOfDay(new Date('2024-06-01T04:00:00Z')); // Istanbul 07:00
    const evening = getStartOfDay(new Date('2024-06-01T19:00:00Z')); // Istanbul 22:00
    expect(morning).toBe(evening);
  });
});

// ─── isInPeriod ─────────────────────────────────────────────────────────────────

describe('isInPeriod', () => {
  const nowSeconds = Math.floor(Date.now() / 1000);

  it('today: bugünün başından sonraki bir kayıt true döner', () => {
    const todayStart = getStartOfDay(new Date());
    expect(isInPeriod(todayStart + 60, 'today')).toBe(true);
  });

  it('today: dünün bir kaydı false döner', () => {
    const todayStart = getStartOfDay(new Date());
    expect(isInPeriod(todayStart - 60, 'today')).toBe(false);
  });

  it('last24h: 23 saat önceki kayıt true döner', () => {
    expect(isInPeriod(nowSeconds - 23 * 3600, 'last24h')).toBe(true);
  });

  it('last24h: 25 saat önceki kayıt false döner', () => {
    expect(isInPeriod(nowSeconds - 25 * 3600, 'last24h')).toBe(false);
  });

  it('week: kayan 7 gün penceresi kullanır (takvim haftası değil)', () => {
    expect(isInPeriod(nowSeconds - 6 * 86400, 'week')).toBe(true);
    expect(isInPeriod(nowSeconds - 8 * 86400, 'week')).toBe(false);
  });

  it('month: kayan 30 gün penceresi kullanır (takvim ayı değil)', () => {
    expect(isInPeriod(nowSeconds - 29 * 86400, 'month')).toBe(true);
    expect(isInPeriod(nowSeconds - 31 * 86400, 'month')).toBe(false);
  });

  it('şu anki zaman damgası her dönem için true döner', () => {
    expect(isInPeriod(nowSeconds, 'today')).toBe(true);
    expect(isInPeriod(nowSeconds, 'last24h')).toBe(true);
    expect(isInPeriod(nowSeconds, 'week')).toBe(true);
    expect(isInPeriod(nowSeconds, 'month')).toBe(true);
  });
});

// ─── getIstanbulDateParts ────────────────────────────────────────────────────────

describe('getIstanbulDateParts', () => {
  it('UTC gece yarısını İstanbul saatiyle doğru tarih/saat/haftagünü bileşenlerine ayırır', () => {
    // 2024-01-15T00:00:00Z (Pazartesi) → Istanbul 2024-01-15 03:00 (hâlâ Pazartesi)
    const parts = getIstanbulDateParts(1705276800);
    expect(parts.date).toBe('2024-01-15');
    expect(parts.hour).toBe(3);
    expect(parts.dayOfWeek).toBe(1); // Pazartesi
  });

  it('gece yarısına yakın bir an İstanbul saatiyle bir sonraki güne geçebilir', () => {
    // 2024-01-14T21:30:00Z → Istanbul 2024-01-15 00:30
    const ts = Math.floor(new Date('2024-01-14T21:30:00Z').getTime() / 1000);
    const parts = getIstanbulDateParts(ts);
    expect(parts.date).toBe('2024-01-15');
    expect(parts.hour).toBe(0);
  });

  it('Pazar günü dayOfWeek 0 döner', () => {
    // 2024-01-14 Pazar, 12:00 Istanbul → 09:00 UTC
    const ts = Math.floor(new Date('2024-01-14T09:00:00Z').getTime() / 1000);
    expect(getIstanbulDateParts(ts).dayOfWeek).toBe(0);
  });
});

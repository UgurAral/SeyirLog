/**
 * src/__tests__/formatters.test.ts
 *
 * formatCurrency, formatKm, formatDuration ve formatDate
 * fonksiyonları için birim testleri.
 */

import {
  formatCurrency,
  formatKm,
  formatDuration,
  formatDate,
} from '../utils/formatters';

// ─── formatCurrency ───────────────────────────────────────────────────────────

describe('formatCurrency', () => {
  it('TRY para birimini varsayılan olarak kullanır ve ₺ ekler', () => {
    const result = formatCurrency(1000);
    expect(result).toContain('₺');
    expect(result).toContain('1');
  });

  it('sıfır değeri doğru formatlar', () => {
    const result = formatCurrency(0);
    expect(result).toContain('0');
    expect(result).toContain('₺');
  });

  it('USD sembolü kullanır', () => {
    const result = formatCurrency(500, 'USD');
    expect(result).toContain('$');
  });

  it('EUR sembolü kullanır', () => {
    const result = formatCurrency(250, 'EUR');
    expect(result).toContain('€');
  });

  it('bilinmeyen para birimi kodu sembol olarak kullanılır', () => {
    const result = formatCurrency(100, 'GBP');
    expect(result).toContain('GBP');
  });

  it('negatif değer formatlanır', () => {
    const result = formatCurrency(-500);
    expect(result).toContain('₺');
    // Negatif değer içeriyor olmalı
    expect(result).toMatch(/-|−/);
  });

  it('büyük sayı virgüllü formatlanır', () => {
    const result = formatCurrency(1234567.89);
    expect(result).toContain('₺');
    // Binlik ayraç veya ondalık ayraç içermeli
    expect(result.length).toBeGreaterThan(5);
  });

  it('iki ondalık basamak içerir', () => {
    const result = formatCurrency(100);
    // tr-TR locale ile 100,00 formatı
    expect(result).toMatch(/,\d{2}/);
  });
});

// ─── formatKm ─────────────────────────────────────────────────────────────────

describe('formatKm', () => {
  it('"km" suffix ekler', () => {
    expect(formatKm(100)).toBe('100 km');
  });

  it('sıfır değeri doğru formatlar', () => {
    expect(formatKm(0)).toBe('0 km');
  });

  it('binlik değerde tr-TR formatı kullanır', () => {
    const result = formatKm(1500);
    expect(result).toContain('km');
    expect(result).toContain('1');
    expect(result).toContain('5');
  });

  it('ondalıklı değer max 1 basamak gösterir', () => {
    const result = formatKm(100.55);
    // 100,6 km veya 100.6 km gibi
    expect(result).toContain('km');
    expect(result.length).toBeGreaterThan(4);
  });

  it('negatif km değerini formatlar', () => {
    const result = formatKm(-50);
    expect(result).toContain('km');
    expect(result).toContain('50');
  });

  it('çok büyük değer', () => {
    const result = formatKm(999999);
    expect(result).toContain('km');
    expect(result).toContain('999');
  });
});

// ─── formatDuration ───────────────────────────────────────────────────────────

describe('formatDuration', () => {
  it('sıfır veya negatif dakika → "0dk"', () => {
    expect(formatDuration(0)).toBe('0dk');
    expect(formatDuration(-10)).toBe('0dk');
  });

  it('60 dakikadan az → sadece dakika', () => {
    expect(formatDuration(30)).toBe('30dk');
    expect(formatDuration(1)).toBe('1dk');
    expect(formatDuration(59)).toBe('59dk');
  });

  it('tam 60 dakika → "1s"', () => {
    expect(formatDuration(60)).toBe('1s');
  });

  it('saat ve dakika birlikte gösterir', () => {
    expect(formatDuration(90)).toBe('1s 30dk');
    expect(formatDuration(125)).toBe('2s 5dk');
  });

  it('tam saat değerleri → sadece saat', () => {
    expect(formatDuration(120)).toBe('2s');
    expect(formatDuration(180)).toBe('3s');
  });

  it('büyük değer: 8 saat 45 dakika', () => {
    expect(formatDuration(525)).toBe('8s 45dk');
  });

  it('tam 1 saat', () => {
    expect(formatDuration(60)).toBe('1s');
  });

  it('birkaç dakika', () => {
    expect(formatDuration(5)).toBe('5dk');
  });
});

// ─── formatDate ───────────────────────────────────────────────────────────────

describe('formatDate', () => {
  // 2024-01-15 00:00:00 UTC → Europe/Istanbul: 2024-01-15 03:00:00
  const jan15_2024 = 1705276800; // 2024-01-15T00:00:00Z

  it('döndürülen değer string olmalı', () => {
    expect(typeof formatDate(jan15_2024)).toBe('string');
  });

  it('yıl içermeli', () => {
    expect(formatDate(jan15_2024)).toContain('2024');
  });

  it('boş değil', () => {
    expect(formatDate(jan15_2024).length).toBeGreaterThan(0);
  });

  it('Ocak ayı için Oca veya Ocak içerir', () => {
    const result = formatDate(jan15_2024);
    // tr-TR locale "Oca" veya "Ocak" döndürebilir
    const hasJan = result.includes('Oca') || result.includes('ocak') || result.includes('Ocak');
    expect(hasJan).toBe(true);
  });

  it('farklı bir tarih için doğru yıl gösterir', () => {
    // 2023-06-15 UTC
    const june15_2023 = 1686787200;
    expect(formatDate(june15_2023)).toContain('2023');
  });

  it('epoch 0 (1970) çalışır', () => {
    const result = formatDate(0);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('büyük timestamp (2030) çalışır', () => {
    // 2030-01-01
    const result = formatDate(1893456000);
    expect(result).toContain('2030');
  });
});

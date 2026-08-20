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
  formatDateTime,
  formatTime,
  formatLiters,
  formatPercent,
  formatElapsedClock,
} from '../utils/formatters';
import { getElapsedSeconds } from '../utils/calculations';

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

  it('ondalık kısım sıfırsa virgül göstermez', () => {
    const result = formatCurrency(100);
    expect(result).not.toContain(',');
  });

  it('ondalık kısım varsa gösterir (max 2 basamak)', () => {
    expect(formatCurrency(100.5)).toBe('100,5 ₺');
    expect(formatCurrency(100.55)).toBe('100,55 ₺');
  });

  it('ondalık kısmı 2 basamağa yuvarlar', () => {
    expect(formatCurrency(100.555)).toBe('100,56 ₺');
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

  it('"mi" birimi seçiliyse mile çevirip "mi" ekler', () => {
    // 160.9344 km ≈ 100 mi
    expect(formatKm(160.9344, 'mi')).toBe('100 mi');
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

// ─── formatDateTime ───────────────────────────────────────────────────────────

describe('formatDateTime', () => {
  const jan15_2024 = 1705276800; // 2024-01-15T00:00:00Z

  it('tarih ve saat birlikte içerir', () => {
    const result = formatDateTime(jan15_2024);
    expect(result).toContain('2024');
    expect(result).toMatch(/\d{1,2}:\d{2}/);
  });

  it('Istanbul saat dilimine göre saat gösterir (00:00 UTC → 03:00 Istanbul)', () => {
    const result = formatDateTime(jan15_2024);
    expect(result).toContain('03:00');
  });
});

// ─── formatTime ───────────────────────────────────────────────────────────────

describe('formatTime', () => {
  it('sadece saat:dakika döner', () => {
    const jan15_2024 = 1705276800; // 00:00 UTC = 03:00 Istanbul
    expect(formatTime(jan15_2024)).toBe('03:00');
  });

  it('yıl veya ay bilgisi içermez', () => {
    const result = formatTime(1705276800);
    expect(result).not.toContain('2024');
  });
});

// ─── formatLiters ─────────────────────────────────────────────────────────────

describe('formatLiters', () => {
  it('"L" suffix ekler', () => {
    expect(formatLiters(45)).toBe('45 L');
  });

  it('ondalıklı değeri virgülle formatlar', () => {
    expect(formatLiters(45.5)).toBe('45,5 L');
  });

  it('sıfırı doğru formatlar', () => {
    expect(formatLiters(0)).toBe('0 L');
  });

  it('max 2 basamağa yuvarlar', () => {
    expect(formatLiters(45.555)).toBe('45,56 L');
  });
});

// ─── formatPercent ────────────────────────────────────────────────────────────

describe('formatPercent', () => {
  it('% işareti başa ekler', () => {
    expect(formatPercent(50)).toBe('%50');
  });

  it('ondalıklı değeri max 1 basamak gösterir', () => {
    expect(formatPercent(12.5)).toBe('%12,5');
  });

  it('sıfırı doğru formatlar', () => {
    expect(formatPercent(0)).toBe('%0');
  });

  it('100 üzeri değeri de formatlar (çağıran taraf sınırlamalı)', () => {
    expect(formatPercent(150)).toBe('%150');
  });
});

// ─── formatElapsedClock ───────────────────────────────────────────────────────

describe('formatElapsedClock', () => {
  it('1 saatten kısa süreyi MM:SS formatlar', () => {
    expect(formatElapsedClock(330)).toBe('05:30');
  });

  it('1 saatten uzun süreyi H:MM:SS formatlar', () => {
    expect(formatElapsedClock(68054)).toBe('18:54:14');
  });

  it('sıfırı 00:00 formatlar', () => {
    expect(formatElapsedClock(0)).toBe('00:00');
  });

  it('negatif değeri 0 gibi işler', () => {
    expect(formatElapsedClock(-10)).toBe('00:00');
  });
});

// ─── getElapsedSeconds ─────────────────────────────────────────────────────────

describe('getElapsedSeconds', () => {
  it('gün başlamamışsa 0 döner', () => {
    expect(getElapsedSeconds(null, null, 0, 1000)).toBe(0);
  });

  it('molasız geçen süreyi doğru hesaplar', () => {
    expect(getElapsedSeconds(1000, null, 0, 1600)).toBe(600);
  });

  it('geçmiş molaları toplam süreden düşer', () => {
    expect(getElapsedSeconds(1000, null, 200, 1600)).toBe(400);
  });

  it('devam eden molayı da düşer (molada iken zaman ilerlese de sonuç sabit kalır)', () => {
    // 1000'de başladı, 1300'de molaya girdi, hâlâ molada
    expect(getElapsedSeconds(1000, 1300, 0, 1400)).toBe(300);
    expect(getElapsedSeconds(1000, 1300, 0, 1900)).toBe(300);
  });
});

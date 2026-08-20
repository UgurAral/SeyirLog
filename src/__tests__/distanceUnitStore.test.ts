/**
 * src/__tests__/distanceUnitStore.test.ts
 *
 * kmToDisplay ve displayToKm saf dönüşüm fonksiyonları için birim testleri.
 * (Zustand store'un AsyncStorage'a bağlı init/set kısmı kapsanmıyor —
 * bu bir native modül gerektirir, manuel test listesinde ayrıca yer alıyor.)
 */

import { kmToDisplay, displayToKm } from '../stores/distanceUnitStore';

describe('kmToDisplay', () => {
  it('unit "km" ise değeri değiştirmeden döner', () => {
    expect(kmToDisplay(100, 'km')).toBe(100);
  });

  it('unit "mi" ise km/1.609344 ile mile çevirir', () => {
    expect(kmToDisplay(160.9344, 'mi')).toBeCloseTo(100, 5);
  });

  it('sıfır km her iki birimde de 0 döner', () => {
    expect(kmToDisplay(0, 'km')).toBe(0);
    expect(kmToDisplay(0, 'mi')).toBe(0);
  });
});

describe('displayToKm', () => {
  it('unit "km" ise değeri değiştirmeden döner', () => {
    expect(displayToKm(100, 'km')).toBe(100);
  });

  it('unit "mi" ise mile*1.609344 ile km\'ye çevirir', () => {
    expect(displayToKm(100, 'mi')).toBeCloseTo(160.9344, 5);
  });
});

describe('kmToDisplay / displayToKm round-trip', () => {
  it('km → mi → km dönüşümü orijinal değeri korur', () => {
    const original = 250;
    const mi = kmToDisplay(original, 'mi');
    const backToKm = displayToKm(mi, 'mi');
    expect(backToKm).toBeCloseTo(original, 9);
  });
});

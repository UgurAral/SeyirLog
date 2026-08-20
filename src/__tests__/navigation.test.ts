/**
 * src/__tests__/navigation.test.ts
 *
 * safeBack — deep-link/bildirim üzerinden stack'e hiç girmeden açılan modal
 * ekranlarda router.back()'in sessizce hiçbir şey yapmama riskine karşı.
 */

import { safeBack } from '../utils/navigation';

function makeRouter(canGoBack: boolean) {
  return {
    canGoBack: jest.fn(() => canGoBack),
    back: jest.fn(),
    replace: jest.fn(),
  };
}

describe('safeBack', () => {
  it('stack\'te geri gidilecek ekran varsa router.back() çağırır', () => {
    const router = makeRouter(true);
    safeBack(router as any);
    expect(router.back).toHaveBeenCalledTimes(1);
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('stack boşsa (canGoBack false) dashboard\'a replace eder', () => {
    const router = makeRouter(false);
    safeBack(router as any);
    expect(router.replace).toHaveBeenCalledWith('/(tabs)');
    expect(router.back).not.toHaveBeenCalled();
  });
});

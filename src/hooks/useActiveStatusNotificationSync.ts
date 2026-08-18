/**
 * useActiveStatusNotificationSync.ts — Aktif sefer/gün store'larını izler ve
 * kalıcı bildirimi buna göre günceller. Öncelik: aktif sefer > aktif gün >
 * bildirim yok. src/services/activeStatusNotification.ts sadece durum
 * değiştiğinde yeniden çizer, saniyelik canlı güncelleme yapmaz.
 */

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { and, eq, gte } from 'drizzle-orm';
import { db } from '@db/index';
import { trips } from '@db/schema';
import { useTripStore } from '@stores/tripStore';
import { useDayTrackingStore } from '@stores/dayTrackingStore';
import { useCurrencyStore } from '@stores/currencyStore';
import { formatTime, formatCurrency } from '@utils/formatters';
import {
  showActiveStatusNotification,
  clearActiveStatusNotification,
} from '@services/activeStatusNotification';

// Gün başından beri tamamlanmış seferlerin (o anki aktif para birimindeki)
// kazanç toplamı — Dashboard'daki "Kazanç" istatistiğiyle aynı tanım.
async function fetchDayEarnings(dayStartedAt: number, currency: string): Promise<number> {
  const rows = await db
    .select({ earnings: trips.earnings, currency: trips.currency })
    .from(trips)
    .where(and(eq(trips.status, 'completed'), gte(trips.startTime, dayStartedAt)));
  return rows.reduce(
    (sum, r) => sum + ((r.currency ?? 'TRY') === currency ? (r.earnings ?? 0) : 0),
    0,
  );
}

export function useActiveStatusNotificationSync() {
  const activeTrip = useTripStore((s) => s.activeTrip);
  const activeSessionId = useDayTrackingStore((s) => s.activeSessionId);
  const dayStartedAt = useDayTrackingStore((s) => s.dayStartedAt);
  const pausedAt = useDayTrackingStore((s) => s.pausedAt);
  const activeCurrency = useCurrencyStore((s) => s.currency);
  const {
    t,
    i18n: { language },
  } = useTranslation();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Gün başlamamışsa (örn. sefer, gün takibinden bağımsız başlatıldıysa)
      // "bugün kazanılan" ifadesi anlamsız — o durumda hiç eklenmez.
      const earningsLabel =
        dayStartedAt != null
          ? t('activeStatusNotification.todayEarningsLabel', {
              amount: formatCurrency(await fetchDayEarnings(dayStartedAt, activeCurrency), activeCurrency),
            })
          : null;
      if (cancelled) return;

      if (activeTrip) {
        const base = t('activeStatusNotification.tripBody', {
          time: formatTime(activeTrip.startTime, language),
        });
        showActiveStatusNotification(
          t('activeStatusNotification.tripTitle'),
          earningsLabel ? `${base} • ${earningsLabel}` : base,
          '/quick-entry',
        );
      } else if (activeSessionId != null && dayStartedAt != null) {
        const base = t(
          pausedAt != null ? 'activeStatusNotification.dayBodyPaused' : 'activeStatusNotification.dayBodyActive',
          { time: formatTime(dayStartedAt, language) },
        );
        showActiveStatusNotification(
          t('activeStatusNotification.dayTitle'),
          earningsLabel ? `${base} • ${earningsLabel}` : base,
          '/(tabs)',
        );
      } else {
        clearActiveStatusNotification();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeTrip, activeSessionId, dayStartedAt, pausedAt, activeCurrency, t, language]);
}

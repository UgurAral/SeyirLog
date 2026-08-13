/**
 * dayTrackingStore.ts — Kullanıcının elle başlatıp bitirdiği "gün" (vardiya)
 * takibi. Her vardiya artık `day_sessions` tablosunda kalıcı bir satır —
 * SQLite'a yazılır ve diğer her şey gibi Firestore'a aynalanır. Böylece
 * başlangıç/bitiş km'leri tam o anda girilmek zorunda değil, sonradan da
 * (Dashboard'daki aktif kart veya Günün Özeti ekranından) eklenip
 * düzenlenebilir.
 *
 * Mola (pause/resume) durumu bilinçli olarak SENKRONIZE EDİLMEZ — sadece bu
 * cihazda, AsyncStorage'da tutulan geçici bir UI durumu. Süre/saatlik kazanç
 * hesabından mola süresini düşmek dışında bir anlamı yok, geçmişe kalıcı
 * kaydedilmesi gerekmiyor.
 */

import { create } from 'zustand';
import { eq, and, isNull, isNotNull, desc } from 'drizzle-orm';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '@db/index';
import { daySessions } from '@db/schema';
import { syncUpsert } from '@services/firestore';
import type { DaySession } from '@/types';

const PAUSED_AT_STORAGE_KEY = '@seyirlog_day_paused_at';
const TOTAL_PAUSED_STORAGE_KEY = '@seyirlog_day_total_paused_seconds';

interface DayTrackingStore {
  activeSessionId: number | null;
  dayStartedAt: number | null;
  startOdometerKm: number | null;
  pausedAt: number | null;
  totalPausedSeconds: number;
  initialized: boolean;

  initDayTracking: () => Promise<void>;
  startDay: (vehicleId?: number | null) => Promise<{ startTime: number; carriedOverOdometerKm: number | null }>;
  setActiveStartOdometer: (km: number | null) => Promise<void>;
  pauseDay: () => Promise<void>;
  resumeDay: () => Promise<void>;
  endDay: () => Promise<{ sessionId: number; startTime: number; endTime: number } | null>;

  getSession: (id: number) => Promise<DaySession | null>;
  updateSessionOdometer: (
    id: number,
    data: { startOdometerKm?: number | null; endOdometerKm?: number | null },
  ) => Promise<void>;
  listSessions: (vehicleId?: number) => Promise<DaySession[]>;
}

function parseStoredInt(raw: string | null): number | null {
  const parsed = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(parsed) ? parsed : null;
}

export const useDayTrackingStore = create<DayTrackingStore>((set, get) => ({
  activeSessionId: null,
  dayStartedAt: null,
  startOdometerKm: null,
  pausedAt: null,
  totalPausedSeconds: 0,
  initialized: false,

  initDayTracking: async () => {
    const [active] = await db
      .select()
      .from(daySessions)
      .where(isNull(daySessions.endTime))
      .orderBy(desc(daySessions.startTime))
      .limit(1);

    const [storedPausedAt, storedTotalPaused] = await Promise.all([
      AsyncStorage.getItem(PAUSED_AT_STORAGE_KEY),
      AsyncStorage.getItem(TOTAL_PAUSED_STORAGE_KEY),
    ]);

    set({
      activeSessionId: active?.id ?? null,
      dayStartedAt: active?.startTime ?? null,
      startOdometerKm: active?.startOdometerKm ?? null,
      // Aktif oturum yoksa (örn. önceki oturum başka bir cihazda bitirildi)
      // yerelde kalmış mola bilgisi anlamsız — temizle.
      pausedAt: active ? parseStoredInt(storedPausedAt) : null,
      totalPausedSeconds: active ? (parseStoredInt(storedTotalPaused) ?? 0) : 0,
      initialized: true,
    });
  },

  startDay: async (vehicleId) => {
    const now = Math.floor(Date.now() / 1000);
    const [inserted] = await db
      .insert(daySessions)
      .values({
        vehicleId: vehicleId ?? null,
        startTime: now,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    // Aynı araç için önceki vardiyanın bitiş km'si varsa, yeni vardiyanın
    // başlangıcına otomatik taşı — araç sayacı kaldığı yerden devam eder.
    // Kullanıcı gerekirse Dashboard'daki satırdan düzeltebilir.
    let carriedOverOdometerKm: number | null = null;
    if (vehicleId != null) {
      const [previous] = await db
        .select({ endOdometerKm: daySessions.endOdometerKm })
        .from(daySessions)
        .where(
          and(
            eq(daySessions.vehicleId, vehicleId),
            isNotNull(daySessions.endTime),
            isNotNull(daySessions.endOdometerKm),
          ),
        )
        .orderBy(desc(daySessions.endTime))
        .limit(1);
      carriedOverOdometerKm = previous?.endOdometerKm ?? null;
    }

    if (carriedOverOdometerKm != null) {
      await db
        .update(daySessions)
        .set({ startOdometerKm: carriedOverOdometerKm, updatedAt: now })
        .where(eq(daySessions.id, inserted.id));
    }

    await Promise.all([
      AsyncStorage.removeItem(PAUSED_AT_STORAGE_KEY),
      AsyncStorage.removeItem(TOTAL_PAUSED_STORAGE_KEY),
    ]);
    set({
      activeSessionId: inserted.id,
      dayStartedAt: now,
      startOdometerKm: carriedOverOdometerKm,
      pausedAt: null,
      totalPausedSeconds: 0,
    });
    syncUpsert('day_sessions', inserted.id, { ...inserted, startOdometerKm: carriedOverOdometerKm });
    return { startTime: now, carriedOverOdometerKm };
  },

  setActiveStartOdometer: async (km) => {
    const { activeSessionId } = get();
    if (activeSessionId == null) return;
    await get().updateSessionOdometer(activeSessionId, { startOdometerKm: km });
    set({ startOdometerKm: km });
  },

  pauseDay: async () => {
    if (get().dayStartedAt == null || get().pausedAt != null) return;
    const now = Math.floor(Date.now() / 1000);
    await AsyncStorage.setItem(PAUSED_AT_STORAGE_KEY, String(now));
    set({ pausedAt: now });
  },

  resumeDay: async () => {
    const { pausedAt, totalPausedSeconds } = get();
    if (pausedAt == null) return;
    const now = Math.floor(Date.now() / 1000);
    const nextTotalPaused = totalPausedSeconds + Math.max(0, now - pausedAt);
    await Promise.all([
      AsyncStorage.removeItem(PAUSED_AT_STORAGE_KEY),
      AsyncStorage.setItem(TOTAL_PAUSED_STORAGE_KEY, String(nextTotalPaused)),
    ]);
    set({ pausedAt: null, totalPausedSeconds: nextTotalPaused });
  },

  endDay: async () => {
    const { activeSessionId, dayStartedAt } = get();
    if (activeSessionId == null || dayStartedAt == null) return null;
    const now = Math.floor(Date.now() / 1000);

    await db
      .update(daySessions)
      .set({ endTime: now, updatedAt: now })
      .where(eq(daySessions.id, activeSessionId));

    await Promise.all([
      AsyncStorage.removeItem(PAUSED_AT_STORAGE_KEY),
      AsyncStorage.removeItem(TOTAL_PAUSED_STORAGE_KEY),
    ]);
    syncUpsert('day_sessions', activeSessionId, { endTime: now, updatedAt: now });

    set({
      activeSessionId: null,
      dayStartedAt: null,
      startOdometerKm: null,
      pausedAt: null,
      totalPausedSeconds: 0,
    });

    return { sessionId: activeSessionId, startTime: dayStartedAt, endTime: now };
  },

  getSession: async (id) => {
    const [row] = await db.select().from(daySessions).where(eq(daySessions.id, id)).limit(1);
    return row ?? null;
  },

  updateSessionOdometer: async (id, data) => {
    const now = Math.floor(Date.now() / 1000);
    await db
      .update(daySessions)
      .set({ ...data, updatedAt: now })
      .where(eq(daySessions.id, id));
    syncUpsert('day_sessions', id, { ...data, updatedAt: now });
    if (get().activeSessionId === id && data.startOdometerKm !== undefined) {
      set({ startOdometerKm: data.startOdometerKm });
    }
  },

  listSessions: async (vehicleId) => {
    const conditions = [isNotNull(daySessions.endTime)];
    if (vehicleId != null) conditions.push(eq(daySessions.vehicleId, vehicleId));
    return db
      .select()
      .from(daySessions)
      .where(and(...conditions))
      .orderBy(desc(daySessions.startTime));
  },
}));

// getElapsedSeconds → src/utils/calculations.ts (saf hesaplama; DB'ye bağlı
// bu store'dan ayrı tutuluyor ki testler expo-sqlite'ı import etmek zorunda
// kalmadan çalışabilsin).

import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { getIstanbulDateParts, istanbulMidnightToTimestamp } from '@utils/dateHelpers';
import { toIntlLocale } from '@utils/formatters';
import { useTheme } from '@/theme/useTheme';
import type { ColorTokens } from '@/theme/colors';

export interface CalendarRangePickerProps {
  /** Seçili aralığın başlangıç günü (İstanbul takvim gününün 00:00'ı, Unix saniye) */
  startDate: number | null;
  /** Seçili aralığın bitiş günü (dahil, İstanbul takvim gününün 00:00'ı, Unix saniye) */
  endDate: number | null;
  onChange: (startDate: number | null, endDate: number | null) => void;
}

const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Pazartesi başlangıçlı

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

function weekdayOf(year: number, month: number, day: number): number {
  return new Date(Date.UTC(year, month, day)).getUTCDay();
}

export function CalendarRangePicker({ startDate, endDate, onChange }: CalendarRangePickerProps) {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const todayParts = useMemo(() => getIstanbulDateParts(Math.floor(Date.now() / 1000)), []);
  const [todayY, todayM] = [Number(todayParts.date.slice(0, 4)), Number(todayParts.date.slice(5, 7)) - 1];

  const initial = startDate ?? Math.floor(Date.now() / 1000);
  const initialParts = getIstanbulDateParts(initial);
  const [viewYear, setViewYear] = useState(Number(initialParts.date.slice(0, 4)));
  const [viewMonth, setViewMonth] = useState(Number(initialParts.date.slice(5, 7)) - 1);

  const monthLabel = new Intl.DateTimeFormat(toIntlLocale(i18n.language), {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(viewYear, viewMonth, 1)));

  const weekdayLabels = WEEKDAY_ORDER.map((wd) =>
    new Intl.DateTimeFormat(toIntlLocale(i18n.language), { weekday: 'short', timeZone: 'UTC' })
      // 2024-01-01 bir Pazartesi'dir — sabit bir referans hafta üzerinden gün adlarını üretiyoruz
      .format(new Date(Date.UTC(2024, 0, 1 + ((wd + 6) % 7)))),
  );

  const goPrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };
  const goNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleDayPress = (day: number) => {
    const ts = istanbulMidnightToTimestamp(viewYear, viewMonth, day);
    if (startDate == null || (startDate != null && endDate != null)) {
      // Yeni bir seçim başlat
      onChange(ts, null);
    } else if (ts < startDate) {
      // İkinci dokunuş başlangıçtan önceyse yer değiştir
      onChange(ts, startDate);
    } else {
      onChange(startDate, ts);
    }
  };

  const total = daysInMonth(viewYear, viewMonth);
  const leadingBlank = (weekdayOf(viewYear, viewMonth, 1) + 6) % 7; // Pazartesi=0 olacak şekilde kaydır
  const cells: (number | null)[] = [
    ...Array(leadingBlank).fill(null),
    ...Array.from({ length: total }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goPrevMonth} hitSlop={10} style={styles.navBtn}>
          <Ionicons name="chevron-back" size={18} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.monthLabel}>{monthLabel}</Text>
        <TouchableOpacity onPress={goNextMonth} hitSlop={10} style={styles.navBtn}>
          <Ionicons name="chevron-forward" size={18} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <View style={styles.weekdayRow}>
        {weekdayLabels.map((label, i) => (
          <Text key={i} style={styles.weekdayLabel}>
            {label}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((day, i) => {
          if (day == null) return <View key={i} style={styles.cell} />;
          const ts = istanbulMidnightToTimestamp(viewYear, viewMonth, day);
          const isStart = startDate != null && ts === startDate;
          const isEnd = endDate != null && ts === endDate;
          const inRange = startDate != null && endDate != null && ts > startDate && ts < endDate;
          const isToday = viewYear === todayY && viewMonth === todayM && day === Number(todayParts.date.slice(8, 10));
          return (
            <View key={i} style={styles.cell}>
              <TouchableOpacity
                onPress={() => handleDayPress(day)}
                style={[
                  styles.dayTouch,
                  inRange && { backgroundColor: colors.accent + '22' },
                  (isStart || isEnd) && { backgroundColor: colors.accent },
                ]}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.dayText,
                    isToday && !isStart && !isEnd && { color: colors.accent, fontWeight: '800' },
                    (isStart || isEnd) && { color: colors.onAccent, fontWeight: '800' },
                  ]}
                >
                  {day}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>

      {(startDate != null || endDate != null) && (
        <TouchableOpacity onPress={() => onChange(null, null)} style={styles.clearBtn}>
          <Text style={styles.clearBtnText}>{t('finans.filterClearDates')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function createStyles(colors: ColorTokens) {
  return StyleSheet.create({
    container: { gap: 8 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    navBtn: { padding: 6 },
    monthLabel: { color: colors.textPrimary, fontSize: 14, fontWeight: '700', textTransform: 'capitalize' },
    weekdayRow: { flexDirection: 'row' },
    weekdayLabel: {
      flex: 1,
      textAlign: 'center',
      color: colors.textMuted,
      fontSize: 11,
      fontWeight: '600',
      textTransform: 'uppercase',
    },
    grid: { flexDirection: 'row', flexWrap: 'wrap' },
    cell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
    dayTouch: {
      width: '80%',
      height: '80%',
      borderRadius: 999,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dayText: { color: colors.textPrimary, fontSize: 13, fontWeight: '600' },
    clearBtn: { alignSelf: 'center', paddingVertical: 8, paddingHorizontal: 12 },
    clearBtnText: { color: colors.accent, fontSize: 13, fontWeight: '600' },
  });
}

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from '@components/ui/BottomSheet';
import { CalendarRangePicker } from '@components/ui/CalendarRangePicker';
import { Input } from '@components/ui/Input';
import { Button } from '@components/ui/Button';
import { getStartOfDay } from '@utils/dateHelpers';
import { useTheme } from '@/theme/useTheme';
import type { ColorTokens } from '@/theme/colors';

export interface FinansFilters {
  /** Boş dizi = tüm türler */
  types: string[];
  startDate: number | null;
  endDate: number | null;
  amountMin: number | null;
  amountMax: number | null;
}

export const EMPTY_FINANS_FILTERS: FinansFilters = {
  types: [],
  startDate: null,
  endDate: null,
  amountMin: null,
  amountMax: null,
};

export function hasActiveFinansFilters(f: FinansFilters): boolean {
  return (
    f.types.length > 0 ||
    f.startDate != null ||
    f.endDate != null ||
    f.amountMin != null ||
    f.amountMax != null
  );
}

interface TypeOption {
  value: string;
  label: string;
  icon: string;
}

interface FinansFilterModalProps {
  visible: boolean;
  onClose: () => void;
  typeOptions: TypeOption[];
  filters: FinansFilters;
  onApply: (filters: FinansFilters) => void;
}

export function FinansFilterModal({ visible, onClose, typeOptions, filters, onApply }: FinansFilterModalProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const [draft, setDraft] = useState<FinansFilters>(filters);

  // Modal her açılışta güncel filtre değerleriyle yeniden başlasın —
  // önceki bir "Uygula" olmadan kapatılıp tekrar açıldığında eski taslak kalmasın.
  useEffect(() => {
    if (visible) setDraft(filters);
  }, [visible, filters]);

  const toggleType = (value: string) => {
    setDraft((d) => ({
      ...d,
      types: d.types.includes(value) ? d.types.filter((v) => v !== value) : [...d.types, value],
    }));
  };

  const applyPreset = (days: number | 'today') => {
    const now = Date.now();
    const todayStart = getStartOfDay(new Date(now));
    const start = days === 'today' ? todayStart : getStartOfDay(new Date(now - days * 86400 * 1000));
    setDraft((d) => ({ ...d, startDate: start, endDate: todayStart }));
  };

  const handleReset = () => {
    setDraft(EMPTY_FINANS_FILTERS);
    onApply(EMPTY_FINANS_FILTERS);
    onClose();
  };

  const handleApply = () => {
    onApply(draft);
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title={t('finans.filterModalTitle')}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Tür */}
        <Text style={styles.sectionLabel}>{t('finans.filterTypeLabel')}</Text>
        <View style={styles.chipRow}>
          {typeOptions.map((opt) => {
            const active = draft.types.includes(opt.value);
            return (
              <TouchableOpacity
                key={opt.value}
                onPress={() => toggleType(opt.value)}
                style={[styles.chip, active && styles.chipActive]}
                activeOpacity={0.75}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {opt.icon} {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Tarih aralığı */}
        <Text style={styles.sectionLabel}>{t('finans.filterDateLabel')}</Text>
        <View style={styles.presetRow}>
          <TouchableOpacity style={styles.presetChip} onPress={() => applyPreset('today')}>
            <Text style={styles.presetChipText}>{t('periods.today')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.presetChip} onPress={() => applyPreset(7)}>
            <Text style={styles.presetChipText}>{t('periods.week')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.presetChip} onPress={() => applyPreset(30)}>
            <Text style={styles.presetChipText}>{t('periods.month')}</Text>
          </TouchableOpacity>
        </View>
        <CalendarRangePicker
          startDate={draft.startDate}
          endDate={draft.endDate}
          onChange={(start, end) => setDraft((d) => ({ ...d, startDate: start, endDate: end }))}
        />

        {/* Tutar aralığı */}
        <Text style={styles.sectionLabel}>{t('finans.filterAmountLabel')}</Text>
        <View style={styles.amountRow}>
          <Input
            containerStyle={styles.amountInput}
            placeholder={t('finans.filterAmountMinPlaceholder')}
            keyboardType="numeric"
            value={draft.amountMin != null ? String(draft.amountMin) : ''}
            onChangeText={(v) => setDraft((d) => ({ ...d, amountMin: v ? parseFloat(v) : null }))}
          />
          <Text style={styles.amountSeparator}>–</Text>
          <Input
            containerStyle={styles.amountInput}
            placeholder={t('finans.filterAmountMaxPlaceholder')}
            keyboardType="numeric"
            value={draft.amountMax != null ? String(draft.amountMax) : ''}
            onChangeText={(v) => setDraft((d) => ({ ...d, amountMax: v ? parseFloat(v) : null }))}
          />
        </View>

        <View style={styles.actions}>
          <Button label={t('finans.filterReset')} onPress={handleReset} variant="ghost" style={styles.actionBtn} />
          <Button label={t('finans.filterApply')} onPress={handleApply} style={styles.actionBtn} />
        </View>
      </ScrollView>
    </BottomSheet>
  );
}

function createStyles(colors: ColorTokens) {
  return StyleSheet.create({
    scroll: { maxHeight: 560 },
    sectionLabel: {
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: '700',
      marginTop: 16,
      marginBottom: 8,
    },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 10,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
    chipText: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
    chipTextActive: { color: colors.onAccent },
    presetRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
    presetChip: {
      flex: 1,
      paddingVertical: 8,
      alignItems: 'center',
      borderRadius: 10,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    presetChipText: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
    amountRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    amountInput: { flex: 1 },
    amountSeparator: { color: colors.textMuted, fontSize: 16 },
    actions: { flexDirection: 'row', gap: 12, marginTop: 20 },
    actionBtn: { flex: 1 },
  });
}

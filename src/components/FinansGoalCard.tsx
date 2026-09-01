import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from '@components/ui/BottomSheet';
import { CalendarRangePicker } from '@components/ui/CalendarRangePicker';
import { Input } from '@components/ui/Input';
import { Button } from '@components/ui/Button';
import { useIncomeRows } from '@hooks/useFinansRows';
import { useVehicles } from '@hooks/useVehicles';
import { useCurrencyStore, CURRENCY_SYMBOLS } from '@stores/currencyStore';
import { useGoalStore, type FinansGoal } from '@stores/goalStore';
import { formatCurrency, formatDate } from '@utils/formatters';
import { useTheme } from '@/theme/useTheme';
import type { ColorTokens } from '@/theme/colors';

export function FinansGoalCard() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { goal, initialized, initGoal, setGoal } = useGoalStore();
  const [editVisible, setEditVisible] = useState(false);
  const { activeVehicle } = useVehicles();
  const activeCurrency = useCurrencyStore((s) => s.currency);
  const { rows } = useIncomeRows(activeVehicle?.id);

  useEffect(() => {
    if (!initialized) initGoal();
  }, [initialized, initGoal]);

  const current = useMemo(() => {
    if (!goal) return 0;
    return rows
      .filter((r) => r.currency === goal.currency && r.date >= goal.startDate && r.date < goal.endDate + 86400)
      .reduce((sum, r) => sum + r.amount, 0);
  }, [rows, goal]);

  if (!initialized) return null;

  if (!goal) {
    return (
      <>
        <TouchableOpacity style={styles.emptyCard} onPress={() => setEditVisible(true)} activeOpacity={0.8}>
          <Ionicons name="flag-outline" size={18} color={colors.accent} />
          <Text style={styles.emptyCardText}>{t('finans.goalSetCta')}</Text>
        </TouchableOpacity>
        <GoalEditModal
          visible={editVisible}
          onClose={() => setEditVisible(false)}
          initialGoal={null}
          defaultCurrency={activeCurrency}
          onSave={setGoal}
        />
      </>
    );
  }

  const pct = goal.amount > 0 ? Math.min(1, current / goal.amount) : 0;
  const reached = current >= goal.amount;

  return (
    <>
      <TouchableOpacity style={styles.card} onPress={() => setEditVisible(true)} activeOpacity={0.85}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{t('finans.goalTitle')}</Text>
          <Text style={styles.dateRange}>
            {formatDate(goal.startDate, i18n.language)} – {formatDate(goal.endDate, i18n.language)}
          </Text>
        </View>
        <View style={styles.track}>
          <View
            style={[
              styles.fill,
              { width: `${pct * 100}%`, backgroundColor: reached ? colors.success : colors.accent },
            ]}
          />
        </View>
        <View style={styles.footerRow}>
          <Text style={styles.progressText}>
            {formatCurrency(current, goal.currency)} / {formatCurrency(goal.amount, goal.currency)}
          </Text>
          <Text style={[styles.pctText, { color: reached ? colors.success : colors.textSecondary }]}>
            {Math.round(pct * 100)}%
          </Text>
        </View>
      </TouchableOpacity>
      <GoalEditModal
        visible={editVisible}
        onClose={() => setEditVisible(false)}
        initialGoal={goal}
        defaultCurrency={activeCurrency}
        onSave={setGoal}
      />
    </>
  );
}

function GoalEditModal({
  visible,
  onClose,
  initialGoal,
  defaultCurrency,
  onSave,
}: {
  visible: boolean;
  onClose: () => void;
  initialGoal: FinansGoal | null;
  defaultCurrency: string;
  onSave: (goal: FinansGoal | null) => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [amount, setAmount] = useState('');
  const [startDate, setStartDate] = useState<number | null>(null);
  const [endDate, setEndDate] = useState<number | null>(null);

  useEffect(() => {
    if (visible) {
      setAmount(initialGoal ? String(initialGoal.amount) : '');
      setStartDate(initialGoal?.startDate ?? null);
      setEndDate(initialGoal?.endDate ?? null);
    }
  }, [visible, initialGoal]);

  const handleSave = () => {
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0 || startDate == null || endDate == null) return;
    onSave({
      amount: amountNum,
      currency: initialGoal?.currency ?? defaultCurrency,
      startDate,
      endDate: endDate < startDate ? startDate : endDate,
    });
    onClose();
  };

  const handleDelete = () => {
    onSave(null);
    onClose();
  };

  const canSave = !!amount && parseFloat(amount) > 0 && startDate != null && endDate != null;

  return (
    <BottomSheet visible={visible} onClose={onClose} title={t('finans.goalModalTitle')}>
      <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
        <Input
          label={t('finans.goalAmountLabel')}
          placeholder={t('finans.goalAmountPlaceholder')}
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
          suffix={CURRENCY_SYMBOLS[(initialGoal?.currency ?? defaultCurrency) as keyof typeof CURRENCY_SYMBOLS]}
        />
        <Text style={styles.sectionLabel}>{t('finans.goalDateLabel')}</Text>
        <CalendarRangePicker
          startDate={startDate}
          endDate={endDate}
          onChange={(s, e) => {
            setStartDate(s);
            setEndDate(e);
          }}
        />
        <View style={styles.actions}>
          {initialGoal && (
            <Button label={t('common.delete')} onPress={handleDelete} variant="ghost" style={styles.actionBtn} />
          )}
          <Button
            label={t('finans.goalSaveButton')}
            onPress={handleSave}
            disabled={!canSave}
            style={styles.actionBtn}
          />
        </View>
      </ScrollView>
    </BottomSheet>
  );
}

function createStyles(colors: ColorTokens) {
  return StyleSheet.create({
    emptyCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderStyle: 'dashed',
      borderRadius: 12,
      padding: 14,
      marginHorizontal: 16,
      marginTop: 12,
    },
    emptyCardText: { color: colors.accent, fontSize: 13, fontWeight: '600' },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 16,
      marginHorizontal: 16,
      marginTop: 12,
      gap: 10,
    },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    title: { color: colors.textPrimary, fontSize: 14, fontWeight: '700' },
    dateRange: { color: colors.textMuted, fontSize: 11 },
    track: { height: 10, borderRadius: 5, backgroundColor: colors.background, overflow: 'hidden' },
    fill: { height: '100%', borderRadius: 5 },
    footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    progressText: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
    pctText: { fontSize: 13, fontWeight: '800' },

    modalScroll: { maxHeight: 520 },
    sectionLabel: { color: colors.textPrimary, fontSize: 14, fontWeight: '700', marginTop: 16, marginBottom: 8 },
    actions: { flexDirection: 'row', gap: 12, marginTop: 20 },
    actionBtn: { flex: 1 },
  });
}

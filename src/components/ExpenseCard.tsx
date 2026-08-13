import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Card } from './ui/Card';
import { formatCurrency, formatDate } from '@utils/formatters';
import { useExpenseStore } from '@stores/expenseStore';
import { useTheme } from '@/theme/useTheme';
import type { ColorTokens } from '@/theme/colors';
import type { Expense, ExpenseCategory } from '@/types';

interface ExpenseCardProps {
  expense: Expense;
}

const CATEGORY_ICONS: Record<ExpenseCategory, string> = {
  bridge: '🌉',
  parking: '🅿️',
  maintenance: '🔧',
  fine: '🚨',
  tire: '🛞',
  wash: '🚿',
  other: '📋',
};

export function ExpenseCard({ expense }: ExpenseCardProps) {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { deleteExpense } = useExpenseStore();
  const category = expense.category as ExpenseCategory;
  const icon = CATEGORY_ICONS[category] ?? '📋';
  const label = t(`expenseCategories.${category}`);

  const handleDelete = () => {
    Alert.alert(
      t('finans.deleteConfirmTitle'),
      `${label} ${t('finans.deleteExpenseConfirmBody', { amount: formatCurrency(expense.amount, expense.currency) })}`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => deleteExpense(expense.id),
        },
      ],
    );
  };

  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <View style={styles.iconWrapper}>
          <Text style={styles.icon}>{icon}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.category}>{label}</Text>
          {expense.description ? (
            <Text style={styles.description} numberOfLines={1}>
              {expense.description}
            </Text>
          ) : null}
          <Text style={styles.date}>{formatDate(expense.date, i18n.language)}</Text>
        </View>
        <View style={styles.rightSection}>
          <Text style={styles.amount}>{formatCurrency(expense.amount, expense.currency)}</Text>
          <TouchableOpacity
            onPress={handleDelete}
            style={styles.deleteBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="trash-outline" size={15} color={colors.danger} />
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );
}

function createStyles(colors: ColorTokens) {
  return StyleSheet.create({
    card: {},
    row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    iconWrapper: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    icon: { fontSize: 20 },
    info: { flex: 1, gap: 2 },
    category: { color: colors.textPrimary, fontWeight: '600', fontSize: 14 },
    description: { color: colors.textSecondary, fontSize: 12 },
    date: { color: colors.textMuted, fontSize: 11 },
    rightSection: {
      alignItems: 'flex-end',
      gap: 6,
    },
    amount: { color: colors.danger, fontWeight: '700', fontSize: 16 },
    deleteBtn: {
      padding: 2,
    },
  });
}

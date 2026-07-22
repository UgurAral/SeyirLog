import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from './ui/Card';
import { formatCurrency, formatDate } from '@utils/formatters';
import { useExpenseStore } from '@stores/expenseStore';
import type { Expense, ExpenseCategory } from '@types/index';

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

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  bridge: 'Köprü/Otoyol',
  parking: 'Otopark',
  maintenance: 'Bakım/Tamir',
  fine: 'Ceza',
  tire: 'Lastik',
  wash: 'Yıkama',
  other: 'Diğer',
};

export function ExpenseCard({ expense }: ExpenseCardProps) {
  const { deleteExpense } = useExpenseStore();
  const category = expense.category as ExpenseCategory;
  const icon = CATEGORY_ICONS[category] ?? '📋';
  const label = CATEGORY_LABELS[category] ?? 'Gider';

  const handleDelete = () => {
    Alert.alert(
      'Kaydı Sil',
      `${label} giderini (${formatCurrency(expense.amount)}) silmek istediğinize emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
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
          <Text style={styles.date}>{formatDate(expense.date)}</Text>
        </View>
        <View style={styles.rightSection}>
          <Text style={styles.amount}>{formatCurrency(expense.amount)}</Text>
          <TouchableOpacity
            onPress={handleDelete}
            style={styles.deleteBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="trash-outline" size={15} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {},
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 20 },
  info: { flex: 1, gap: 2 },
  category: { color: '#F1F5F9', fontWeight: '600', fontSize: 14 },
  description: { color: '#94A3B8', fontSize: 12 },
  date: { color: '#64748B', fontSize: 11 },
  rightSection: {
    alignItems: 'flex-end',
    gap: 6,
  },
  amount: { color: '#EF4444', fontWeight: '700', fontSize: 16 },
  deleteBtn: {
    padding: 2,
  },
});

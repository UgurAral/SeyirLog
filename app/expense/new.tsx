import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@components/ui/Card';
import { Input } from '@components/ui/Input';
import { Button } from '@components/ui/Button';
import { useExpenseStore } from '@stores/expenseStore';
import type { NewExpense, ExpenseCategory } from '@/types';
import { EXPENSE_CATEGORY_OPTIONS } from '@/types';

export default function NewExpenseScreen() {
  const router = useRouter();
  const { addExpense } = useExpenseStore();

  const [category, setCategory] = useState<ExpenseCategory>('other');
  const [form, setForm] = useState({
    amount: '',
    description: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const amountNum = parseFloat(form.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Geçersiz Tutar', 'Lütfen geçerli bir tutar girin.');
      return;
    }

    setSaving(true);
    try {
      const now = Math.floor(Date.now() / 1000);
      const expense: NewExpense = {
        category,
        amount: amountNum,
        description: form.description.trim() || undefined,
        date: now,
        createdAt: now,
        updatedAt: now,
      };
      await addExpense(expense);
      router.back();
    } catch (e) {
      Alert.alert('Hata', String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Kategori</Text>
          <View style={styles.chips}>
            {EXPENSE_CATEGORY_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                label={opt.label}
                onPress={() => setCategory(opt.value as ExpenseCategory)}
                variant={category === opt.value ? 'primary' : 'ghost'}
                size="sm"
              />
            ))}
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Tutar</Text>
          <Input
            label="Tutar *"
            placeholder="Gider miktarı"
            value={form.amount}
            onChangeText={(v) => setForm((f) => ({ ...f, amount: v }))}
            keyboardType="numeric"
            suffix="₺"
          />
          <Input
            label="Açıklama"
            placeholder="İsteğe bağlı açıklama..."
            value={form.description}
            onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
            multiline
            numberOfLines={2}
          />
        </Card>

        <View style={styles.actions}>
          <Button
            label="İptal"
            onPress={() => router.back()}
            variant="ghost"
            style={styles.actionBtn}
          />
          <Button
            label="💰 Gideri Kaydet"
            onPress={handleSave}
            loading={saving}
            style={styles.actionBtn}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0F172A' },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  card: { gap: 12 },
  sectionTitle: { color: '#F1F5F9', fontSize: 15, fontWeight: '700' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actions: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1 },
});

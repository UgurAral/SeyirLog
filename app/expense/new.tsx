import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Card } from '@components/ui/Card';
import { Input } from '@components/ui/Input';
import { Button } from '@components/ui/Button';
import { useExpenseStore } from '@stores/expenseStore';
import { useVehicleStore } from '@stores/vehicleStore';
import { useCurrencyStore, CURRENCY_SYMBOLS } from '@stores/currencyStore';
import type { NewExpense, ExpenseCategory } from '@/types';
import { useExpenseCategoryOptions } from '@/i18n/options';
import { AdBanner } from '@components/AdBanner';

export default function NewExpenseScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { addExpense } = useExpenseStore();
  const { activeVehicle } = useVehicleStore();
  const categoryOptions = useExpenseCategoryOptions();
  const activeCurrency = useCurrencyStore((s) => s.currency);

  const [category, setCategory] = useState<ExpenseCategory>('other');
  const [form, setForm] = useState({
    amount: '',
    description: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const amountNum = parseFloat(form.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert(t('expenseNew.invalidAmountTitle'), t('expenseNew.invalidAmountBody'));
      return;
    }

    setSaving(true);
    try {
      const now = Math.floor(Date.now() / 1000);
      const expense: NewExpense = {
        vehicleId: activeVehicle?.id,
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
      Alert.alert(t('common.error'), String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      <AdBanner position="top" />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>{t('expenseNew.category')}</Text>
          <View style={styles.chips}>
            {categoryOptions.map((opt) => (
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
          <Text style={styles.sectionTitle}>{t('expenseNew.amountSection')}</Text>
          <Input
            label={t('expenseNew.amountLabel')}
            placeholder={t('expenseNew.amountPlaceholder')}
            value={form.amount}
            onChangeText={(v) => setForm((f) => ({ ...f, amount: v }))}
            keyboardType="numeric"
            suffix={CURRENCY_SYMBOLS[activeCurrency]}
          />
          <Input
            label={t('expenseNew.descriptionLabel')}
            placeholder={t('expenseNew.descriptionPlaceholder')}
            value={form.description}
            onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
            multiline
            numberOfLines={2}
          />
        </Card>

        <View style={styles.actions}>
          <Button
            label={t('common.cancel')}
            onPress={() => router.back()}
            variant="ghost"
            style={styles.actionBtn}
          />
          <Button
            label={t('expenseNew.saveButton')}
            onPress={handleSave}
            loading={saving}
            style={styles.actionBtn}
          />
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
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

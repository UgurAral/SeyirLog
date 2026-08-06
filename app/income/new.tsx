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
import { useIncomeStore } from '@stores/incomeStore';
import { useVehicleStore } from '@stores/vehicleStore';
import { useCurrencyStore, CURRENCY_SYMBOLS } from '@stores/currencyStore';
import type { NewIncomeEntry, IncomeSource } from '@/types';
import { useIncomeSourceOptions } from '@/i18n/options';
import { formatCurrency } from '@utils/formatters';
import { AdBanner } from '@components/AdBanner';

export default function NewIncomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { addEntry } = useIncomeStore();
  const { activeVehicle } = useVehicleStore();
  const sourceOptions = useIncomeSourceOptions();
  const activeCurrency = useCurrencyStore((s) => s.currency);

  const [source, setSource] = useState<IncomeSource>('trip');
  const [form, setForm] = useState({
    amount: '',
    description: '',
  });
  const [saving, setSaving] = useState(false);

  const amountNum = parseFloat(form.amount) || 0;

  const handleSave = async () => {
    if (!form.amount || amountNum <= 0) {
      Alert.alert(t('incomeNew.invalidAmountTitle'), t('incomeNew.invalidAmountBody'));
      return;
    }

    setSaving(true);
    try {
      const now = Math.floor(Date.now() / 1000);
      const entry: Omit<NewIncomeEntry, 'createdAt' | 'updatedAt'> = {
        amount: amountNum,
        source,
        description: form.description.trim() || undefined,
        date: now,
        vehicleId: activeVehicle?.id ?? undefined,
      };
      await addEntry(entry);
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
        {/* Kaynak Seçici */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>{t('incomeNew.sourceSection')}</Text>
          <View style={styles.chips}>
            {sourceOptions.map((opt) => (
              <Button
                key={opt.value}
                label={opt.label}
                onPress={() => setSource(opt.value as IncomeSource)}
                variant={source === opt.value ? 'primary' : 'ghost'}
                size="sm"
              />
            ))}
          </View>
        </Card>

        {/* Tutar */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>{t('incomeNew.amountSection')}</Text>
          <Input
            label={t('incomeNew.amountLabel')}
            placeholder={t('incomeNew.amountPlaceholder')}
            value={form.amount}
            onChangeText={(v) => setForm((f) => ({ ...f, amount: v }))}
            keyboardType="numeric"
            suffix={CURRENCY_SYMBOLS[activeCurrency]}
          />
          {amountNum > 0 && (
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>{t('incomeNew.incomePreviewLabel')}</Text>
              <Text style={styles.previewValue}>{formatCurrency(amountNum, activeCurrency)}</Text>
            </View>
          )}
          <Input
            label={t('incomeNew.descriptionLabel')}
            placeholder={t('incomeNew.descriptionPlaceholder')}
            value={form.description}
            onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
            multiline
            numberOfLines={2}
          />
        </Card>

        {/* Aktif Araç Bilgisi */}
        {activeVehicle && (
          <View style={styles.vehicleInfo}>
            <Text style={styles.vehicleInfoText}>
              🚗 {activeVehicle.brand} {activeVehicle.model} — {activeVehicle.plate ?? t('incomeNew.noPlate')}
            </Text>
          </View>
        )}

        {/* Aksiyon Butonları */}
        <View style={styles.actions}>
          <Button
            label={t('common.cancel')}
            onPress={() => router.back()}
            variant="ghost"
            style={styles.actionBtn}
          />
          <Button
            label={t('incomeNew.saveButton')}
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
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 10,
    padding: 12,
  },
  previewLabel: { color: '#94A3B8', fontSize: 14 },
  previewValue: { color: '#22C55E', fontWeight: '700', fontSize: 18 },
  vehicleInfo: {
    backgroundColor: '#1E293B',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  vehicleInfoText: { color: '#94A3B8', fontSize: 13 },
  actions: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1 },
});

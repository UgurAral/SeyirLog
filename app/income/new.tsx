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
import { useIncomeStore } from '@stores/incomeStore';
import { useVehicleStore } from '@stores/vehicleStore';
import type { NewIncomeEntry, IncomeSource } from '@types/index';
import { INCOME_SOURCE_OPTIONS } from '@types/index';
import { formatCurrency } from '@utils/formatters';

export default function NewIncomeScreen() {
  const router = useRouter();
  const { addEntry } = useIncomeStore();
  const { activeVehicle } = useVehicleStore();

  const [source, setSource] = useState<IncomeSource>('trip');
  const [form, setForm] = useState({
    amount: '',
    description: '',
  });
  const [saving, setSaving] = useState(false);

  const amountNum = parseFloat(form.amount) || 0;

  const handleSave = async () => {
    if (!form.amount || amountNum <= 0) {
      Alert.alert('Geçersiz Tutar', 'Lütfen geçerli bir tutar girin.');
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
        {/* Kaynak Seçici */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Gelir Kaynağı</Text>
          <View style={styles.chips}>
            {INCOME_SOURCE_OPTIONS.map((opt) => (
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
          <Text style={styles.sectionTitle}>Tutar</Text>
          <Input
            label="Tutar *"
            placeholder="Gelir miktarı"
            value={form.amount}
            onChangeText={(v) => setForm((f) => ({ ...f, amount: v }))}
            keyboardType="numeric"
            suffix="₺"
          />
          {amountNum > 0 && (
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Gelir</Text>
              <Text style={styles.previewValue}>{formatCurrency(amountNum)}</Text>
            </View>
          )}
          <Input
            label="Açıklama"
            placeholder="İsteğe bağlı açıklama..."
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
              🚗 {activeVehicle.brand} {activeVehicle.model} — {activeVehicle.plate ?? 'Plakasız'}
            </Text>
          </View>
        )}

        {/* Aksiyon Butonları */}
        <View style={styles.actions}>
          <Button
            label="İptal"
            onPress={() => router.back()}
            variant="ghost"
            style={styles.actionBtn}
          />
          <Button
            label="💵 Geliri Kaydet"
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

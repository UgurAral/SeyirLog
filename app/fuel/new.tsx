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
import { useFuelStore } from '@stores/fuelStore';
import type { NewFuelEntry } from '@types/index';
import { formatCurrency } from '@utils/formatters';

export default function NewFuelScreen() {
  const router = useRouter();
  const { addFuelEntry } = useFuelStore();

  const [form, setForm] = useState({
    liters: '',
    pricePerLiter: '',
    currentKm: '',
    stationName: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  const litersNum = parseFloat(form.liters) || 0;
  const priceNum = parseFloat(form.pricePerLiter) || 0;
  const totalCost = litersNum * priceNum;

  const handleSave = async () => {
    if (!form.liters || !form.pricePerLiter) {
      Alert.alert('Eksik Bilgi', 'Litre ve litre fiyatı zorunludur.');
      return;
    }
    if (litersNum <= 0 || priceNum <= 0) {
      Alert.alert('Geçersiz Değer', 'Litre ve fiyat sıfırdan büyük olmalıdır.');
      return;
    }

    setSaving(true);
    try {
      const now = Math.floor(Date.now() / 1000);
      const entry: NewFuelEntry = {
        liters: litersNum,
        pricePerLiter: priceNum,
        totalCost,
        currentKm: form.currentKm ? parseFloat(form.currentKm) : undefined,
        stationName: form.stationName.trim() || undefined,
        notes: form.notes.trim() || undefined,
        date: now,
        createdAt: now,
        updatedAt: now,
      };
      await addFuelEntry(entry);
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
          <Text style={styles.sectionTitle}>Yakıt Bilgileri</Text>
          <Input
            label="Litre *"
            placeholder="Kaç litre yakıt aldın?"
            value={form.liters}
            onChangeText={(v) => setForm((f) => ({ ...f, liters: v }))}
            keyboardType="numeric"
            suffix="L"
          />
          <Input
            label="Litre Fiyatı *"
            placeholder="Litre başı fiyat"
            value={form.pricePerLiter}
            onChangeText={(v) => setForm((f) => ({ ...f, pricePerLiter: v }))}
            keyboardType="numeric"
            suffix="₺/L"
          />
          {totalCost > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Toplam Maliyet</Text>
              <Text style={styles.totalValue}>{formatCurrency(totalCost)}</Text>
            </View>
          )}
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Ek Bilgiler</Text>
          <Input
            label="Güncel KM"
            placeholder="Araç saatindeki km değeri"
            value={form.currentKm}
            onChangeText={(v) => setForm((f) => ({ ...f, currentKm: v }))}
            keyboardType="numeric"
            suffix="km"
          />
          <Input
            label="İstasyon Adı"
            placeholder="Örn: Shell, BP, Opet..."
            value={form.stationName}
            onChangeText={(v) => setForm((f) => ({ ...f, stationName: v }))}
            autoCapitalize="words"
          />
          <Input
            label="Not"
            placeholder="İsteğe bağlı not..."
            value={form.notes}
            onChangeText={(v) => setForm((f) => ({ ...f, notes: v }))}
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
            label="⛽ Yakıtı Kaydet"
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
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 10,
    padding: 12,
  },
  totalLabel: { color: '#94A3B8', fontSize: 14 },
  totalValue: { color: '#EF4444', fontWeight: '700', fontSize: 18 },
  actions: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1 },
});

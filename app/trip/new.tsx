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
import { useTripStore } from '@stores/tripStore';
import type { NewTrip } from '@/types';

export default function NewTripScreen() {
  const router = useRouter();
  const { addTrip } = useTripStore();

  const [form, setForm] = useState({
    origin: '',
    destination: '',
    startKm: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.origin.trim() || !form.destination.trim()) {
      Alert.alert('Eksik Bilgi', 'Kalkış ve varış noktaları zorunludur.');
      return;
    }
    const startKmNum = parseFloat(form.startKm);
    if (isNaN(startKmNum) || startKmNum < 0) {
      Alert.alert('Geçersiz KM', 'Lütfen geçerli bir başlangıç km değeri girin.');
      return;
    }

    setSaving(true);
    try {
      const now = Math.floor(Date.now() / 1000);
      const newTrip: NewTrip = {
        origin: form.origin.trim(),
        destination: form.destination.trim(),
        startKm: startKmNum,
        startTime: now,
        notes: form.notes.trim() || undefined,
        status: 'active',
        createdAt: now,
        updatedAt: now,
      };
      await addTrip(newTrip);
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
          <Text style={styles.sectionTitle}>Rota Bilgileri</Text>
          <Input
            label="Kalkış Noktası *"
            placeholder="Nereden?"
            value={form.origin}
            onChangeText={(v) => setForm((f) => ({ ...f, origin: v }))}
            autoCapitalize="sentences"
          />
          <Input
            label="Varış Noktası *"
            placeholder="Nereye?"
            value={form.destination}
            onChangeText={(v) => setForm((f) => ({ ...f, destination: v }))}
            autoCapitalize="sentences"
          />
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>KM Bilgisi</Text>
          <Input
            label="Başlangıç KM *"
            placeholder="Araç saatindeki km değeri"
            value={form.startKm}
            onChangeText={(v) => setForm((f) => ({ ...f, startKm: v }))}
            keyboardType="numeric"
            suffix="km"
          />
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Notlar</Text>
          <Input
            label="Not (isteğe bağlı)"
            placeholder="Yolculuk hakkında not..."
            value={form.notes}
            onChangeText={(v) => setForm((f) => ({ ...f, notes: v }))}
            multiline
            numberOfLines={3}
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
            label="Seferi Başlat 🚀"
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
  actions: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1 },
});

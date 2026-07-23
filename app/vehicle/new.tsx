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
import { useVehicleStore } from '@stores/vehicleStore';
import type { NewVehicle, VehicleType, FuelType } from '@/types';
import { VEHICLE_TYPE_OPTIONS, FUEL_TYPE_OPTIONS } from '@/types';

const DEFAULT_FORM: Omit<NewVehicle, 'createdAt' | 'updatedAt'> = {
  brand: '',
  model: '',
  year: new Date().getFullYear(),
  plate: '',
  type: 'car',
  fuelType: 'gasoline',
  isActive: 1,
};

export default function NewVehicleScreen() {
  const router = useRouter();
  const { addVehicle } = useVehicleStore();

  const [form, setForm] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.brand.trim()) {
      Alert.alert('Eksik Bilgi', 'Araç markası zorunludur.');
      return;
    }
    if (!form.model.trim()) {
      Alert.alert('Eksik Bilgi', 'Araç modeli zorunludur.');
      return;
    }

    setSaving(true);
    try {
      await addVehicle({
        ...form,
        brand: form.brand.trim(),
        model: form.model.trim(),
        plate: form.plate?.trim() || undefined,
      });
      Alert.alert('Başarılı', 'Araç eklendi!', [
        { text: 'Tamam', onPress: () => router.back() },
      ]);
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
        {/* Temel Bilgiler */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Araç Bilgileri</Text>
          <Input
            label="Marka *"
            placeholder="Toyota, Ford, Renault..."
            value={form.brand}
            onChangeText={(v) => setForm((f) => ({ ...f, brand: v }))}
            autoCapitalize="words"
          />
          <Input
            label="Model *"
            placeholder="Corolla, Focus, Megane..."
            value={form.model}
            onChangeText={(v) => setForm((f) => ({ ...f, model: v }))}
            autoCapitalize="words"
          />
          <Input
            label="Plaka"
            placeholder="34 ABC 1234"
            value={form.plate ?? ''}
            onChangeText={(v) =>
              setForm((f) => ({ ...f, plate: v.toUpperCase() }))
            }
            autoCapitalize="characters"
          />
          <Input
            label="Yıl"
            placeholder="2024"
            value={form.year ? String(form.year) : ''}
            onChangeText={(v) =>
              setForm((f) => ({
                ...f,
                year: v ? (parseInt(v, 10) || undefined) : undefined,
              }))
            }
            keyboardType="numeric"
            maxLength={4}
          />
        </Card>

        {/* Araç Tipi */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Araç Tipi</Text>
          <View style={styles.chips}>
            {VEHICLE_TYPE_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                label={opt.label}
                onPress={() =>
                  setForm((f) => ({ ...f, type: opt.value as VehicleType }))
                }
                variant={form.type === opt.value ? 'primary' : 'ghost'}
                size="sm"
              />
            ))}
          </View>
        </Card>

        {/* Yakıt Tipi */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Yakıt Tipi</Text>
          <View style={styles.chips}>
            {FUEL_TYPE_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                label={opt.label}
                onPress={() =>
                  setForm((f) => ({ ...f, fuelType: opt.value as FuelType }))
                }
                variant={form.fuelType === opt.value ? 'primary' : 'ghost'}
                size="sm"
              />
            ))}
          </View>
        </Card>

        {/* Aksiyon Butonları */}
        <View style={styles.actions}>
          <Button
            label="İptal"
            onPress={() => router.back()}
            variant="ghost"
            style={styles.actionBtn}
          />
          <Button
            label="🚗 Aracı Ekle"
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

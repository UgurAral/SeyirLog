import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@components/ui/Card';
import { Input } from '@components/ui/Input';
import { Button } from '@components/ui/Button';
import { useVehicleStore } from '@stores/vehicleStore';
import type { Vehicle, VehicleType, FuelType } from '@types/index';
import { VEHICLE_TYPE_OPTIONS, FUEL_TYPE_OPTIONS } from '@types/index';

const VEHICLE_TYPE_LABEL: Record<string, string> = {
  car: 'Araba',
  motorcycle: 'Motosiklet',
  truck: 'Kamyon',
  van: 'Van',
};

const FUEL_TYPE_LABEL: Record<string, string> = {
  gasoline: 'Benzin',
  diesel: 'Dizel',
  electric: 'Elektrik',
  lpg: 'LPG',
};

export default function VehicleDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { vehicles, updateVehicle, deleteVehicle, setActiveVehicle, activeVehicle } =
    useVehicleStore();

  const vehicle = vehicles.find((v) => v.id === Number(id));

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<Partial<Vehicle>>(vehicle ?? {});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (vehicle) {
      setForm(vehicle);
    }
  }, [vehicle]);

  if (!vehicle) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.notFoundText}>Araç bulunamadı.</Text>
          <Button label="Geri Dön" onPress={() => router.back()} variant="ghost" />
        </View>
      </SafeAreaView>
    );
  }

  const isActive = activeVehicle?.id === vehicle.id;

  const handleSave = async () => {
    if (!form.brand?.trim()) {
      Alert.alert('Eksik Bilgi', 'Araç markası zorunludur.');
      return;
    }
    if (!form.model?.trim()) {
      Alert.alert('Eksik Bilgi', 'Araç modeli zorunludur.');
      return;
    }

    setSaving(true);
    try {
      await updateVehicle(vehicle.id, {
        brand: form.brand?.trim(),
        model: form.model?.trim(),
        plate: form.plate?.trim() || undefined,
        year: form.year,
        type: form.type as VehicleType,
        fuelType: form.fuelType as FuelType,
      });
      setIsEditing(false);
      Alert.alert('Başarılı', 'Araç güncellendi.');
    } catch (e) {
      Alert.alert('Hata', String(e));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Aracı Sil',
      `${vehicle.brand} ${vehicle.model} silinecek. Bu işlem geri alınamaz.`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteVehicle(vehicle.id);
              router.back();
            } catch (e) {
              Alert.alert('Hata', String(e));
            }
          },
        },
      ],
    );
  };

  const handleSetActive = () => {
    setActiveVehicle(vehicle);
    Alert.alert('Aktif Araç', `${vehicle.brand} ${vehicle.model} aktif araç olarak seçildi.`);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: `${vehicle.brand} ${vehicle.model}`,
          headerRight: () =>
            !isEditing ? (
              <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.editBtn}>
                <Text style={styles.editBtnText}>Düzenle</Text>
              </TouchableOpacity>
            ) : null,
        }}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Araç Başlığı */}
        <Card style={styles.headerCard}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.vehicleName}>
                {vehicle.brand} {vehicle.model}
              </Text>
              <Text style={styles.vehicleMeta}>
                {vehicle.year ?? '—'} • {VEHICLE_TYPE_LABEL[vehicle.type] ?? vehicle.type} •{' '}
                {FUEL_TYPE_LABEL[vehicle.fuelType] ?? vehicle.fuelType}
              </Text>
              {vehicle.plate && (
                <View style={styles.plateBadge}>
                  <Text style={styles.plateText}>{vehicle.plate}</Text>
                </View>
              )}
            </View>
            {isActive && (
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>✓ Aktif</Text>
              </View>
            )}
          </View>
        </Card>

        {!isEditing ? (
          /* ─── Görüntüleme Modu ─── */
          <>
            <Card style={styles.card}>
              <Text style={styles.sectionTitle}>Araç Detayları</Text>
              <DetailRow label="Marka" value={vehicle.brand} />
              <DetailRow label="Model" value={vehicle.model} />
              <DetailRow label="Yıl" value={vehicle.year ? String(vehicle.year) : '—'} />
              <DetailRow label="Plaka" value={vehicle.plate ?? '—'} />
              <DetailRow label="Araç Tipi" value={VEHICLE_TYPE_LABEL[vehicle.type] ?? vehicle.type} />
              <DetailRow
                label="Yakıt Tipi"
                value={FUEL_TYPE_LABEL[vehicle.fuelType] ?? vehicle.fuelType}
              />
            </Card>

            <View style={styles.actionGroup}>
              {!isActive && (
                <Button
                  label="✓ Aktif Araç Yap"
                  onPress={handleSetActive}
                  variant="primary"
                />
              )}
              <Button
                label="✏️ Düzenle"
                onPress={() => setIsEditing(true)}
                variant="ghost"
              />
              <Button
                label="🗑️ Aracı Sil"
                onPress={handleDelete}
                variant="danger"
              />
            </View>
          </>
        ) : (
          /* ─── Düzenleme Modu ─── */
          <>
            <Card style={styles.card}>
              <Text style={styles.sectionTitle}>Araç Bilgilerini Düzenle</Text>
              <Input
                label="Marka *"
                placeholder="Toyota, Ford, Renault..."
                value={form.brand ?? ''}
                onChangeText={(v) => setForm((f) => ({ ...f, brand: v }))}
                autoCapitalize="words"
              />
              <Input
                label="Model *"
                placeholder="Corolla, Focus, Megane..."
                value={form.model ?? ''}
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

            <View style={styles.actions}>
              <Button
                label="İptal"
                onPress={() => {
                  setForm(vehicle);
                  setIsEditing(false);
                }}
                variant="ghost"
                style={styles.actionBtn}
              />
              <Button
                label="💾 Kaydet"
                onPress={handleSave}
                loading={saving}
                style={styles.actionBtn}
              />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={detailStyles.row}>
      <Text style={detailStyles.label}>{label}</Text>
      <Text style={detailStyles.value}>{value}</Text>
    </View>
  );
}

const detailStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  label: { color: '#94A3B8', fontSize: 14 },
  value: { color: '#F1F5F9', fontSize: 14, fontWeight: '500' },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0F172A' },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  notFoundText: { color: '#94A3B8', fontSize: 16 },
  headerCard: { gap: 4 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  vehicleName: { color: '#F1F5F9', fontSize: 20, fontWeight: '800' },
  vehicleMeta: { color: '#94A3B8', fontSize: 13, marginTop: 4 },
  plateBadge: {
    marginTop: 8,
    backgroundColor: '#0F172A',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#334155',
  },
  plateText: { color: '#F1F5F9', fontSize: 13, fontWeight: '700', letterSpacing: 1 },
  activeBadge: {
    backgroundColor: '#15803D',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  activeBadgeText: { color: '#DCFCE7', fontSize: 12, fontWeight: '600' },
  card: { gap: 8 },
  sectionTitle: { color: '#F1F5F9', fontSize: 15, fontWeight: '700', marginBottom: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actionGroup: { gap: 10 },
  actions: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1 },
  editBtn: { paddingHorizontal: 12 },
  editBtnText: { color: '#3B82F6', fontSize: 15, fontWeight: '600' },
});

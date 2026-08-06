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
import { useTranslation } from 'react-i18next';
import { Card } from '@components/ui/Card';
import { Input } from '@components/ui/Input';
import { Button } from '@components/ui/Button';
import { BrandModelFields } from '@components/ui/BrandModelFields';
import { useVehicleStore } from '@stores/vehicleStore';
import type { Vehicle, VehicleType, FuelType } from '@/types';
import { useVehicleTypeOptions, useFuelTypeOptions } from '@/i18n/options';
import { AdBanner } from '@components/AdBanner';

export default function VehicleDetailScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { vehicles, updateVehicle, deleteVehicle, setActiveVehicle, activeVehicle } =
    useVehicleStore();
  const vehicleTypeOptions = useVehicleTypeOptions();
  const fuelTypeOptions = useFuelTypeOptions();

  const vehicle = vehicles.find((v) => v.id === Number(id));

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<Partial<Vehicle>>(vehicle ?? {});
  const [saving, setSaving] = useState(false);
  const [brandDropdownOpen, setBrandDropdownOpen] = useState(false);

  useEffect(() => {
    if (vehicle) {
      setForm(vehicle);
    }
  }, [vehicle]);

  if (!vehicle) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.notFoundText}>{t('vehicleDetail.notFound')}</Text>
          <Button label={t('vehicleDetail.backButton')} onPress={() => router.back()} variant="ghost" />
        </View>
      </SafeAreaView>
    );
  }

  const isActive = activeVehicle?.id === vehicle.id;
  const vehicleTypeLabel = t(`vehicleTypes.${vehicle.type}`);
  const fuelTypeLabel = t(`fuelTypes.${vehicle.fuelType}`);

  const handleSave = async () => {
    if (!form.brand?.trim()) {
      Alert.alert(t('vehicleDetail.missingBrandTitle'), t('vehicleDetail.missingBrandBody'));
      return;
    }
    if (!form.model?.trim()) {
      Alert.alert(t('vehicleDetail.missingModelTitle'), t('vehicleDetail.missingModelBody'));
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
      Alert.alert(t('vehicleDetail.updateSuccessTitle'), t('vehicleDetail.updateSuccessBody'));
    } catch (e) {
      Alert.alert(t('common.error'), String(e));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      t('vehicleDetail.deleteConfirmTitle'),
      t('vehicleDetail.deleteConfirmBody', { name: `${vehicle.brand} ${vehicle.model}` }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteVehicle(vehicle.id);
              router.back();
            } catch (e) {
              Alert.alert(t('common.error'), String(e));
            }
          },
        },
      ],
    );
  };

  const handleSetActive = () => {
    setActiveVehicle(vehicle);
    Alert.alert(t('vehicleDetail.setActiveTitle'), t('vehicleDetail.setActiveBody', { name: `${vehicle.brand} ${vehicle.model}` }));
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: `${vehicle.brand} ${vehicle.model}`,
          headerRight: () =>
            !isEditing ? (
              <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.editBtn}>
                <Text style={styles.editBtnText}>{t('vehicleDetail.editButton')}</Text>
              </TouchableOpacity>
            ) : null,
        }}
      />
      <AdBanner position="top" />
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
                {vehicle.year ?? '—'} • {vehicleTypeLabel} •{' '}
                {fuelTypeLabel}
              </Text>
              {vehicle.plate && (
                <View style={styles.plateBadge}>
                  <Text style={styles.plateText}>{vehicle.plate}</Text>
                </View>
              )}
            </View>
            {isActive && (
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>✓ {t('vehicle.active')}</Text>
              </View>
            )}
          </View>
        </Card>

        {!isEditing ? (
          /* ─── Görüntüleme Modu ─── */
          <>
            <Card style={styles.card}>
              <Text style={styles.sectionTitle}>{t('vehicleDetail.detailsSection')}</Text>
              <DetailRow label={t('vehicleDetail.brand')} value={vehicle.brand} />
              <DetailRow label={t('vehicleDetail.model')} value={vehicle.model} />
              <DetailRow label={t('vehicleDetail.year')} value={vehicle.year ? String(vehicle.year) : '—'} />
              <DetailRow label={t('vehicleDetail.plate')} value={vehicle.plate ?? '—'} />
              <DetailRow label={t('vehicleDetail.vehicleType')} value={vehicleTypeLabel} />
              <DetailRow
                label={t('vehicleDetail.fuelType')}
                value={fuelTypeLabel}
              />
            </Card>

            <View style={styles.actionGroup}>
              {!isActive && (
                <Button
                  label={t('vehicleDetail.setActiveButton')}
                  onPress={handleSetActive}
                  variant="primary"
                />
              )}
              <Button
                label={t('vehicleDetail.editButtonWithIcon')}
                onPress={() => setIsEditing(true)}
                variant="ghost"
              />
              <Button
                label={t('vehicleDetail.deleteButton')}
                onPress={handleDelete}
                variant="danger"
              />
            </View>
          </>
        ) : (
          /* ─── Düzenleme Modu ─── */
          <>
            <Card style={[styles.card, brandDropdownOpen && styles.cardRaised]}>
              <Text style={styles.sectionTitle}>{t('vehicleDetail.editSection')}</Text>
              <BrandModelFields
                brand={form.brand ?? ''}
                model={form.model ?? ''}
                onChangeBrand={(v) => setForm((f) => ({ ...f, brand: v }))}
                onChangeModel={(v) => setForm((f) => ({ ...f, model: v }))}
                brandLabel={t('vehicleNew.brandLabel')}
                brandPlaceholder={t('vehicleNew.brandPlaceholder')}
                modelLabel={t('vehicleNew.modelLabel')}
                modelPlaceholder={t('vehicleNew.modelPlaceholder')}
                onDropdownVisibleChange={setBrandDropdownOpen}
              />
              <Input
                label={t('vehicleNew.plateLabel')}
                placeholder={t('vehicleNew.platePlaceholder')}
                value={form.plate ?? ''}
                onChangeText={(v) =>
                  setForm((f) => ({ ...f, plate: v.toUpperCase() }))
                }
                autoCapitalize="characters"
              />
              <Input
                label={t('vehicleNew.yearLabel')}
                placeholder={t('vehicleNew.yearPlaceholder')}
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
              <Text style={styles.sectionTitle}>{t('vehicleDetail.typeSection')}</Text>
              <View style={styles.chips}>
                {vehicleTypeOptions.map((opt) => (
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
              <Text style={styles.sectionTitle}>{t('vehicleDetail.fuelTypeSection')}</Text>
              <View style={styles.chips}>
                {fuelTypeOptions.map((opt) => (
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
                label={t('common.cancel')}
                onPress={() => {
                  setForm(vehicle);
                  setIsEditing(false);
                }}
                variant="ghost"
                style={styles.actionBtn}
              />
              <Button
                label={t('vehicleDetail.saveButton')}
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
  cardRaised: { zIndex: 50, elevation: 50 },
  sectionTitle: { color: '#F1F5F9', fontSize: 15, fontWeight: '700', marginBottom: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actionGroup: { gap: 10 },
  actions: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1 },
  editBtn: { paddingHorizontal: 12 },
  editBtnText: { color: '#3B82F6', fontSize: 15, fontWeight: '600' },
});

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
import { BrandModelFields } from '@components/ui/BrandModelFields';
import { useVehicleStore } from '@stores/vehicleStore';
import type { NewVehicle, VehicleType, FuelType } from '@/types';
import { useVehicleTypeOptions, useFuelTypeOptions } from '@/i18n/options';
import { AdBanner } from '@components/AdBanner';
import { useTheme } from '@/theme/useTheme';
import type { ColorTokens } from '@/theme/colors';

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
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { addVehicle } = useVehicleStore();
  const vehicleTypeOptions = useVehicleTypeOptions();
  const fuelTypeOptions = useFuelTypeOptions();

  const [form, setForm] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [brandDropdownOpen, setBrandDropdownOpen] = useState(false);

  const handleSave = async () => {
    if (!form.brand.trim()) {
      Alert.alert(t('vehicleNew.missingBrandTitle'), t('vehicleNew.missingBrandBody'));
      return;
    }
    if (!form.model.trim()) {
      Alert.alert(t('vehicleNew.missingModelTitle'), t('vehicleNew.missingModelBody'));
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
      Alert.alert(t('vehicleNew.successTitle'), t('vehicleNew.successBody'), [
        { text: t('common.ok'), onPress: () => router.back() },
      ]);
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
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
      <AdBanner position="top" />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Temel Bilgiler */}
        <Card style={[styles.card, brandDropdownOpen && styles.cardRaised]}>
          <Text style={styles.sectionTitle}>{t('vehicleNew.infoSection')}</Text>
          <BrandModelFields
            brand={form.brand}
            model={form.model}
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

        {/* Araç Tipi */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>{t('vehicleNew.typeSection')}</Text>
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

        {/* Yakıt Tipi */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>{t('vehicleNew.fuelTypeSection')}</Text>
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

        {/* Aksiyon Butonları */}
        <View style={styles.actions}>
          <Button
            label={t('common.cancel')}
            onPress={() => router.back()}
            variant="ghost"
            style={styles.actionBtn}
          />
          <Button
            label={t('vehicleNew.addButton')}
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

function createStyles(colors: ColorTokens) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    content: { padding: 16, gap: 16, paddingBottom: 40 },
    card: { gap: 12 },
    cardRaised: { zIndex: 50, elevation: 50 },
    sectionTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '700' },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    actions: { flexDirection: 'row', gap: 12 },
    actionBtn: { flex: 1 },
  });
}

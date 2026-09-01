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
import { useFuelStore } from '@stores/fuelStore';
import { useVehicleStore } from '@stores/vehicleStore';
import { useCurrencyStore, CURRENCY_SYMBOLS } from '@stores/currencyStore';
import { useDistanceUnitStore, displayToKm } from '@stores/distanceUnitStore';
import type { NewFuelEntry } from '@/types';
import { formatCurrency } from '@utils/formatters';
import { parseLocaleNumber } from '@utils/calculations';
import { AdBanner } from '@components/AdBanner';
import { useKeyboardHeight } from '@hooks/useKeyboardHeight';
import { useTheme } from '@/theme/useTheme';
import type { ColorTokens } from '@/theme/colors';

export default function NewFuelScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { addFuelEntry } = useFuelStore();
  const { activeVehicle } = useVehicleStore();
  const activeCurrency = useCurrencyStore((s) => s.currency);
  const keyboardHeight = useKeyboardHeight();
  const distanceUnit = useDistanceUnitStore((s) => s.unit);

  const [form, setForm] = useState({
    totalPaid: '',
    liters: '',
    pricePerLiter: '',
    currentKm: '',
    stationName: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  const totalPaidNum = parseLocaleNumber(form.totalPaid) || 0;
  const litersNum = parseLocaleNumber(form.liters) || 0;
  const priceNum = parseLocaleNumber(form.pricePerLiter) || 0;
  const computedFromLiters = litersNum * priceNum;
  const totalCost = totalPaidNum > 0 ? totalPaidNum : computedFromLiters;

  const handleSave = async () => {
    if (totalPaidNum <= 0 && (litersNum <= 0 || priceNum <= 0)) {
      Alert.alert(t('fuelNew.missingInfoTitle'), t('fuelNew.missingInfoBody'));
      return;
    }

    setSaving(true);
    try {
      const now = Math.floor(Date.now() / 1000);
      const entry: NewFuelEntry = {
        vehicleId: activeVehicle?.id,
        liters: litersNum,
        pricePerLiter: priceNum,
        totalCost,
        currentKm: form.currentKm ? displayToKm(parseLocaleNumber(form.currentKm), distanceUnit) : undefined,
        stationName: form.stationName.trim() || undefined,
        notes: form.notes.trim() || undefined,
        date: now,
        createdAt: now,
        updatedAt: now,
      };
      await addFuelEntry(entry);
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
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
      <AdBanner position="top" />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>{t('fuelNew.fuelInfo')}</Text>
          <Input
            label={t('fuelNew.totalPaidLabel')}
            placeholder={t('fuelNew.totalPaidPlaceholder')}
            value={form.totalPaid}
            onChangeText={(v) => setForm((f) => ({ ...f, totalPaid: v }))}
            keyboardType="numeric"
            suffix={CURRENCY_SYMBOLS[activeCurrency]}
          />
          {totalCost > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{t('fuelNew.totalCostLabel')}</Text>
              <Text style={styles.totalValue}>{formatCurrency(totalCost, activeCurrency)}</Text>
            </View>
          )}
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>{t('fuelNew.detailSection')}</Text>
          <Text style={styles.sectionDesc}>{t('fuelNew.detailSectionDesc')}</Text>
          <Input
            label={t('fuelNew.litersLabel')}
            placeholder={t('fuelNew.litersPlaceholder')}
            value={form.liters}
            onChangeText={(v) => setForm((f) => ({ ...f, liters: v }))}
            keyboardType="numeric"
            suffix="L"
          />
          <Input
            label={t('fuelNew.priceLabel')}
            placeholder={t('fuelNew.pricePlaceholder')}
            value={form.pricePerLiter}
            onChangeText={(v) => setForm((f) => ({ ...f, pricePerLiter: v }))}
            keyboardType="numeric"
            suffix={`${CURRENCY_SYMBOLS[activeCurrency]}/L`}
          />
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>{t('fuelNew.additionalInfo')}</Text>
          <Input
            label={t('fuelNew.currentKmLabel')}
            placeholder={t('fuelNew.currentKmPlaceholder')}
            value={form.currentKm}
            onChangeText={(v) => setForm((f) => ({ ...f, currentKm: v }))}
            keyboardType="numeric"
            suffix={distanceUnit}
          />
          <Input
            label={t('fuelNew.stationLabel')}
            placeholder={t('fuelNew.stationPlaceholder')}
            value={form.stationName}
            onChangeText={(v) => setForm((f) => ({ ...f, stationName: v }))}
            autoCapitalize="words"
          />
          <Input
            label={t('fuelNew.noteLabel')}
            placeholder={t('fuelNew.notePlaceholder')}
            value={form.notes}
            onChangeText={(v) => setForm((f) => ({ ...f, notes: v }))}
            multiline
            numberOfLines={2}
          />
        </Card>
      </ScrollView>

      <View style={[styles.actions, keyboardHeight > 0 && { marginBottom: keyboardHeight }]}>
        <Button
          label={t('common.cancel')}
          onPress={() => router.back()}
          variant="ghost"
          style={styles.actionBtn}
        />
        <Button
          label={t('fuelNew.saveButton')}
          onPress={handleSave}
          loading={saving}
          style={styles.actionBtn}
        />
      </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(colors: ColorTokens) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    content: { padding: 16, gap: 16, paddingBottom: 24 },
    card: { gap: 12 },
    sectionTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '700' },
    sectionDesc: { color: colors.textMuted, fontSize: 12, marginTop: -6 },
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.background,
      borderRadius: 10,
      padding: 12,
    },
    totalLabel: { color: colors.textSecondary, fontSize: 14 },
    totalValue: { color: colors.danger, fontWeight: '700', fontSize: 18 },
    // Kaydet butonu ScrollView dışında, klavyenin hemen üstünde sabit bir
    // alt bar olarak durur — form ne kadar uzasa da kaydırmadan her zaman
    // görünür kalır (önceden içerideydi ve uzun formda klavye altında kalıyordu).
    actions: {
      flexDirection: 'row',
      gap: 12,
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.background,
    },
    actionBtn: { flex: 1 },
  });
}

import React, { useEffect, useRef, useState } from 'react';
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
import { useTripStore } from '@stores/tripStore';
import { useVehicleStore } from '@stores/vehicleStore';
import { AdBanner } from '@components/AdBanner';
import { getCurrentCoords, reverseGeocodeLabel } from '@utils/location';
import { submitDemandSignal } from '@services/firestore';
import { useTheme } from '@/theme/useTheme';
import type { ColorTokens } from '@/theme/colors';
import type { NewTrip } from '@/types';

export default function NewTripScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { addTrip } = useTripStore();
  const { activeVehicle } = useVehicleStore();

  const [form, setForm] = useState({
    origin: 'A',
    destination: 'B',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const savedRef = useRef(false);

  // Ekran açılır açılmaz, arka planda "Nereden" alanını konumdan otomatik doldurmayı dene.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const coords = await getCurrentCoords();
      if (!coords || cancelled) return;
      const label = await reverseGeocodeLabel(coords.lat, coords.lng);
      if (!label || cancelled || savedRef.current) return;
      setForm((f) => (f.origin === 'A' ? { ...f, origin: label } : f));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async () => {
    savedRef.current = true;
    setSaving(true);
    try {
      const now = Math.floor(Date.now() / 1000);
      const newTrip: NewTrip = {
        vehicleId: activeVehicle?.id,
        origin: form.origin.trim() || 'A',
        destination: form.destination.trim() || 'B',
        startTime: now,
        notes: form.notes.trim() || undefined,
        status: 'active',
        createdAt: now,
        updatedAt: now,
      };
      await addTrip(newTrip);
      // "Sefer Başlat" anında GPS'i taze ölçüp anonim talep sinyali gönder — sefer
      // oluşturmayı ve navigasyonu bloklamadan, tamamen arka planda.
      (async () => {
        const coords = await getCurrentCoords();
        if (coords) submitDemandSignal(coords.lat, coords.lng, now);
      })();
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
          <Text style={styles.sectionTitle}>{t('tripNew.routeInfo')}</Text>
          <Input
            label={t('tripNew.originLabel')}
            placeholder={t('tripNew.originPlaceholder')}
            value={form.origin}
            onChangeText={(v) => setForm((f) => ({ ...f, origin: v }))}
            autoCapitalize="sentences"
          />
          <Input
            label={t('tripNew.destinationLabel')}
            placeholder={t('tripNew.destinationPlaceholder')}
            value={form.destination}
            onChangeText={(v) => setForm((f) => ({ ...f, destination: v }))}
            autoCapitalize="sentences"
          />
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>{t('tripNew.notesSection')}</Text>
          <Input
            label={t('tripNew.noteLabel')}
            placeholder={t('tripNew.notePlaceholder')}
            value={form.notes}
            onChangeText={(v) => setForm((f) => ({ ...f, notes: v }))}
            multiline
            numberOfLines={3}
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
            label={t('tripNew.startButton')}
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
    sectionTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '700' },
    actions: { flexDirection: 'row', gap: 12 },
    actionBtn: { flex: 1 },
  });
}

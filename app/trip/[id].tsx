import React, { useState, useMemo } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { useTripStore } from '@stores/tripStore';
import { useCurrencyStore, CURRENCY_SYMBOLS } from '@stores/currencyStore';
import { useDistanceUnitStore, kmToDisplay, displayToKm } from '@stores/distanceUnitStore';
import { formatCurrency, formatKm, formatDateTime, formatDuration } from '@utils/formatters';
import { resolveTripDurationMinutes } from '@utils/calculations';
import { AdBanner } from '@components/AdBanner';
import { useTheme } from '@/theme/useTheme';
import type { ColorTokens } from '@/theme/colors';

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { trips, completeTrip, updateTrip, cancelTrip, deleteTrip } = useTripStore();
  const activeCurrency = useCurrencyStore((s) => s.currency);
  const distanceUnit = useDistanceUnitStore((s) => s.unit);

  const tripId = parseInt(id, 10);
  const trip = useMemo(
    () => trips.find((t) => t.id === tripId) ?? null,
    [trips, tripId],
  );

  const [distanceKm, setDistanceKm] = useState('');
  const [earnings, setEarnings] = useState('');
  const [durationMinutesInput, setDurationMinutesInput] = useState('');
  const [completing, setCompleting] = useState(false);

  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ origin: '', destination: '', distanceKm: '', earnings: '', durationMinutes: '' });
  const [savingEdit, setSavingEdit] = useState(false);

  if (!trip) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.notFound}>{t('tripDetail.notFound')}</Text>
          <Button label={t('common.back')} onPress={() => router.back()} variant="ghost" />
        </View>
      </SafeAreaView>
    );
  }

  const isActive = trip.status === 'active';
  const durationMinutes = resolveTripDurationMinutes(trip);
  const perKm =
    trip.earnings != null && trip.distanceKm != null && trip.distanceKm > 0
      ? trip.earnings / kmToDisplay(trip.distanceKm, distanceUnit)
      : null;

  const handleComplete = async () => {
    const earningsNum = parseFloat(earnings);
    if (isNaN(earningsNum) || earningsNum < 0) {
      Alert.alert(t('tripDetail.invalidEarningsTitle'), t('tripDetail.invalidEarningsBody'));
      return;
    }
    const distanceNum = parseFloat(distanceKm);
    if (distanceKm.trim() && (isNaN(distanceNum) || distanceNum < 0)) {
      Alert.alert(t('tripDetail.invalidDistanceTitle'), t('tripDetail.invalidDistanceBody'));
      return;
    }
    const durationNum = parseFloat(durationMinutesInput);
    if (durationMinutesInput.trim() && (isNaN(durationNum) || durationNum < 0)) {
      Alert.alert(t('tripDetail.invalidDurationTitle'), t('tripDetail.invalidDurationBody'));
      return;
    }
    const distanceValue = distanceKm.trim() ? distanceNum : null;
    const distanceValueKm = distanceValue != null ? displayToKm(distanceValue, distanceUnit) : null;
    const durationOverride = durationMinutesInput.trim() ? durationNum : undefined;
    setCompleting(true);
    try {
      const now = Math.floor(Date.now() / 1000);
      await completeTrip(tripId, distanceValueKm, now, earningsNum, durationOverride);
      const perKm = distanceValue && distanceValue > 0 ? earningsNum / distanceValue : null;
      Alert.alert(
        t('tripDetail.completedTitle'),
        perKm != null
          ? `${t('tripDetail.completedBody')}\n${t('tripDetail.perKmLabel')}: ${formatCurrency(perKm, activeCurrency)}/${distanceUnit}`
          : t('tripDetail.completedBody'),
        [{ text: t('common.ok'), onPress: () => router.replace('/(tabs)') }],
      );
    } catch (e) {
      Alert.alert(t('common.error'), String(e));
    } finally {
      setCompleting(false);
    }
  };

  const handleStartEdit = () => {
    if (!trip) return;
    setEditForm({
      origin: trip.origin,
      destination: trip.destination,
      distanceKm: trip.distanceKm != null ? String(kmToDisplay(trip.distanceKm, distanceUnit)) : '',
      earnings: trip.earnings != null ? String(trip.earnings) : '',
      durationMinutes: durationMinutes != null ? String(durationMinutes) : '',
    });
    setEditing(true);
  };

  const handleSaveEdit = async () => {
    const earningsNum = parseFloat(editForm.earnings);
    if (isNaN(earningsNum) || earningsNum < 0) {
      Alert.alert(t('tripDetail.invalidEarningsTitle'), t('tripDetail.invalidEarningsBody'));
      return;
    }
    const distanceNum = parseFloat(editForm.distanceKm);
    if (editForm.distanceKm.trim() && (isNaN(distanceNum) || distanceNum < 0)) {
      Alert.alert(t('tripDetail.invalidDistanceTitle'), t('tripDetail.invalidDistanceBody'));
      return;
    }
    const durationNum = parseFloat(editForm.durationMinutes);
    if (editForm.durationMinutes.trim() && (isNaN(durationNum) || durationNum < 0)) {
      Alert.alert(t('tripDetail.invalidDurationTitle'), t('tripDetail.invalidDurationBody'));
      return;
    }
    setSavingEdit(true);
    try {
      await updateTrip(tripId, {
        origin: editForm.origin.trim() || 'A',
        destination: editForm.destination.trim() || 'B',
        distanceKm: editForm.distanceKm.trim() ? displayToKm(distanceNum, distanceUnit) : null,
        earnings: earningsNum,
        durationMinutes: editForm.durationMinutes.trim() ? durationNum : null,
      });
      setEditing(false);
    } catch (e) {
      Alert.alert(t('common.error'), String(e));
    } finally {
      setSavingEdit(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      t('tripDetail.cancelConfirmTitle'),
      t('tripDetail.cancelConfirmBody'),
      [
        { text: t('common.no'), style: 'cancel' },
        {
          text: t('tripDetail.yesCancelIt'),
          style: 'destructive',
          onPress: async () => {
            await cancelTrip(tripId);
            router.back();
          },
        },
      ],
    );
  };

  const handleDelete = () => {
    Alert.alert(
      t('tripDetail.deleteConfirmTitle'),
      t('tripDetail.deleteConfirmBody'),
      [
        { text: t('common.no'), style: 'cancel' },
        {
          text: t('tripDetail.yesDeleteIt'),
          style: 'destructive',
          onPress: async () => {
            await deleteTrip(tripId);
            router.back();
          },
        },
      ],
    );
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
        {/* Route */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>{t('tripDetail.route')}</Text>
          {editing ? (
            <>
              <Input
                label={t('tripDetail.departure')}
                value={editForm.origin}
                onChangeText={(v) => setEditForm((f) => ({ ...f, origin: v }))}
                autoCapitalize="sentences"
              />
              <Input
                label={t('tripDetail.arrival')}
                value={editForm.destination}
                onChangeText={(v) => setEditForm((f) => ({ ...f, destination: v }))}
                autoCapitalize="sentences"
              />
            </>
          ) : (
            <View style={styles.routeRow}>
              <View style={styles.routePoint}>
                <Text style={styles.routeLabel}>{t('tripDetail.departure')}</Text>
                <Text style={styles.routeValue}>{trip.origin}</Text>
              </View>
              <Text style={styles.arrow}>→</Text>
              <View style={styles.routePoint}>
                <Text style={styles.routeLabel}>{t('tripDetail.arrival')}</Text>
                <Text style={styles.routeValue}>{trip.destination}</Text>
              </View>
            </View>
          )}
        </Card>

        {/* Details */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>{t('tripDetail.details')}</Text>
          <DetailRow label={t('tripDetail.start')} value={formatDateTime(trip.startTime, i18n.language)} />
          {trip.endTime ? (
            <DetailRow label={t('tripDetail.end')} value={formatDateTime(trip.endTime, i18n.language)} />
          ) : null}
          {trip.startKm != null && (
            <DetailRow label={t('tripDetail.startKm')} value={formatKm(trip.startKm, distanceUnit)} />
          )}
          {trip.endKm != null && (
            <DetailRow label={t('tripDetail.endKm')} value={formatKm(trip.endKm, distanceUnit)} />
          )}
          {trip.distanceKm != null && (
            <DetailRow label={t('tripDetail.distance')} value={formatKm(trip.distanceKm, distanceUnit)} />
          )}
          {durationMinutes != null ? (
            <DetailRow label={t('tripDetail.duration')} value={formatDuration(durationMinutes, i18n.language)} />
          ) : null}
          {trip.earnings != null && (
            <DetailRow
              label={t('tripDetail.earnings')}
              value={formatCurrency(trip.earnings, trip.currency)}
              valueColor={colors.success}
            />
          )}
          {perKm != null && (
            <DetailRow
              label={t('tripDetail.perKmLabel')}
              value={`${formatCurrency(perKm, trip.currency)}/${distanceUnit}`}
            />
          )}
          {trip.notes ? (
            <DetailRow label={t('tripDetail.note')} value={trip.notes} />
          ) : null}
        </Card>

        {/* Complete Form */}
        {isActive ? (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>{t('tripDetail.completeSection')}</Text>
            <Input
              label={t('tripDetail.earningsLabel')}
              placeholder={t('tripDetail.earningsPlaceholder')}
              value={earnings}
              onChangeText={setEarnings}
              keyboardType="numeric"
              suffix={CURRENCY_SYMBOLS[activeCurrency]}
            />
            <Input
              label={t('tripDetail.distanceLabel')}
              placeholder={t('tripDetail.distancePlaceholder', { unit: distanceUnit })}
              value={distanceKm}
              onChangeText={setDistanceKm}
              keyboardType="numeric"
              suffix={distanceUnit}
            />
            <Input
              label={t('tripDetail.durationLabel')}
              placeholder={t('tripDetail.durationPlaceholder')}
              value={durationMinutesInput}
              onChangeText={setDurationMinutesInput}
              keyboardType="numeric"
              suffix="dk"
            />
            <Button
              label={t('tripDetail.completeButton')}
              onPress={handleComplete}
              loading={completing}
            />
            <Button
              label={t('tripDetail.cancelTripButton')}
              onPress={handleCancel}
              variant="danger"
            />
          </Card>
        ) : null}

        {/* Edit Form (biten/iptal edilen seferler) */}
        {!isActive && editing ? (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>{t('tripDetail.editSection')}</Text>
            <Input
              label={t('tripDetail.earningsLabel')}
              placeholder={t('tripDetail.earningsPlaceholder')}
              value={editForm.earnings}
              onChangeText={(v) => setEditForm((f) => ({ ...f, earnings: v }))}
              keyboardType="numeric"
              suffix={CURRENCY_SYMBOLS[activeCurrency]}
            />
            <Input
              label={t('tripDetail.distanceLabel')}
              placeholder={t('tripDetail.distancePlaceholder', { unit: distanceUnit })}
              value={editForm.distanceKm}
              onChangeText={(v) => setEditForm((f) => ({ ...f, distanceKm: v }))}
              keyboardType="numeric"
              suffix={distanceUnit}
            />
            <Input
              label={t('tripDetail.durationLabel')}
              placeholder={t('tripDetail.durationPlaceholder')}
              value={editForm.durationMinutes}
              onChangeText={(v) => setEditForm((f) => ({ ...f, durationMinutes: v }))}
              keyboardType="numeric"
              suffix="dk"
            />
            <View style={styles.editActions}>
              <Button
                label={t('common.cancel')}
                onPress={() => setEditing(false)}
                variant="ghost"
                style={styles.actionBtn}
              />
              <Button
                label={t('common.save')}
                onPress={handleSaveEdit}
                loading={savingEdit}
                style={styles.actionBtn}
              />
            </View>
          </Card>
        ) : null}

        {/* Edit / Delete (biten/iptal edilen seferler) */}
        {!isActive && !editing ? (
          <View style={styles.editActions}>
            <Button
              label={t('common.edit')}
              onPress={handleStartEdit}
              variant="ghost"
              style={styles.actionBtn}
            />
            <Button
              label={t('tripDetail.deleteButton')}
              onPress={handleDelete}
              variant="danger"
              style={styles.actionBtn}
            />
          </View>
        ) : null}
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function DetailRow({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, { color: valueColor ?? colors.textPrimary }]}>{value}</Text>
    </View>
  );
}

function createStyles(colors: ColorTokens) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    content: { padding: 16, gap: 16, paddingBottom: 40 },
    card: { gap: 12 },
    sectionTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '700' },
    routeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    routePoint: { flex: 1, gap: 4 },
    routeLabel: { color: colors.textMuted, fontSize: 12 },
    routeValue: { color: colors.textPrimary, fontWeight: '600', fontSize: 15 },
    arrow: { color: colors.accent, fontSize: 20, fontWeight: '700' },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 6,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    detailLabel: { color: colors.textMuted, fontSize: 13 },
    detailValue: { fontSize: 13, fontWeight: '600' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
    notFound: { color: colors.textSecondary, fontSize: 16 },
    editActions: { flexDirection: 'row', gap: 12 },
    actionBtn: { flex: 1 },
  });
}

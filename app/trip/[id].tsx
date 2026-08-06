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
import { formatCurrency, formatKm, formatDateTime } from '@utils/formatters';
import { calculateTripDuration } from '@utils/calculations';
import { AdBanner } from '@components/AdBanner';

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { trips, completeTrip, cancelTrip, deleteTrip } = useTripStore();
  const activeCurrency = useCurrencyStore((s) => s.currency);

  const tripId = parseInt(id, 10);
  const trip = useMemo(
    () => trips.find((t) => t.id === tripId) ?? null,
    [trips, tripId],
  );

  const [distanceKm, setDistanceKm] = useState('');
  const [earnings, setEarnings] = useState('');
  const [completing, setCompleting] = useState(false);

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
  const duration =
    trip.startTime && trip.endTime
      ? calculateTripDuration(trip.startTime, trip.endTime, i18n.language)
      : null;

  const handleComplete = async () => {
    const distanceNum = parseFloat(distanceKm);
    const earningsNum = parseFloat(earnings);
    if (isNaN(distanceNum) || distanceNum <= 0) {
      Alert.alert(t('tripDetail.invalidDistanceTitle'), t('tripDetail.invalidDistanceBody'));
      return;
    }
    if (isNaN(earningsNum) || earningsNum < 0) {
      Alert.alert(t('tripDetail.invalidEarningsTitle'), t('tripDetail.invalidEarningsBody'));
      return;
    }
    setCompleting(true);
    try {
      const now = Math.floor(Date.now() / 1000);
      await completeTrip(tripId, distanceNum, now, earningsNum);
      const perKm = distanceNum > 0 ? earningsNum / distanceNum : 0;
      Alert.alert(
        t('tripDetail.completedTitle'),
        `${t('tripDetail.completedBody')}\n${t('tripDetail.perKmLabel')}: ${formatCurrency(perKm, activeCurrency)}/km`,
      );
    } catch (e) {
      Alert.alert(t('common.error'), String(e));
    } finally {
      setCompleting(false);
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
        </Card>

        {/* Details */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>{t('tripDetail.details')}</Text>
          <DetailRow label={t('tripDetail.start')} value={formatDateTime(trip.startTime, i18n.language)} />
          {trip.endTime ? (
            <DetailRow label={t('tripDetail.end')} value={formatDateTime(trip.endTime, i18n.language)} />
          ) : null}
          {trip.startKm != null && (
            <DetailRow label={t('tripDetail.startKm')} value={formatKm(trip.startKm)} />
          )}
          {trip.endKm != null && (
            <DetailRow label={t('tripDetail.endKm')} value={formatKm(trip.endKm)} />
          )}
          {trip.distanceKm != null && (
            <DetailRow label={t('tripDetail.distance')} value={formatKm(trip.distanceKm)} />
          )}
          {duration ? (
            <DetailRow label={t('tripDetail.duration')} value={duration.display} />
          ) : null}
          {trip.earnings != null && (
            <DetailRow
              label={t('tripDetail.earnings')}
              value={formatCurrency(trip.earnings, trip.currency)}
              valueColor="#22C55E"
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
              label={t('tripDetail.distanceLabel')}
              placeholder={t('tripDetail.distancePlaceholder')}
              value={distanceKm}
              onChangeText={setDistanceKm}
              keyboardType="numeric"
              suffix="km"
            />
            <Input
              label={t('tripDetail.earningsLabel')}
              placeholder={t('tripDetail.earningsPlaceholder')}
              value={earnings}
              onChangeText={setEarnings}
              keyboardType="numeric"
              suffix={CURRENCY_SYMBOLS[activeCurrency]}
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

        {/* Delete */}
        {!isActive ? (
          <Button
            label={t('tripDetail.deleteButton')}
            onPress={handleDelete}
            variant="danger"
          />
        ) : null}
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function DetailRow({
  label,
  value,
  valueColor = '#F1F5F9',
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, { color: valueColor }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0F172A' },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  card: { gap: 12 },
  sectionTitle: { color: '#F1F5F9', fontSize: 15, fontWeight: '700' },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  routePoint: { flex: 1, gap: 4 },
  routeLabel: { color: '#64748B', fontSize: 12 },
  routeValue: { color: '#F1F5F9', fontWeight: '600', fontSize: 15 },
  arrow: { color: '#3B82F6', fontSize: 20, fontWeight: '700' },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  detailLabel: { color: '#64748B', fontSize: 13 },
  detailValue: { fontSize: 13, fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  notFound: { color: '#94A3B8', fontSize: 16 },
});

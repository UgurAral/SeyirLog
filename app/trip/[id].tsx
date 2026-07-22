import React, { useState, useMemo } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { useTripStore } from '@stores/tripStore';
import { formatCurrency, formatKm, formatDateTime, formatDuration } from '@utils/formatters';
import { calculateTripDuration } from '@utils/calculations';

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { trips, completeTrip, cancelTrip, deleteTrip } = useTripStore();

  const tripId = parseInt(id, 10);
  const trip = useMemo(
    () => trips.find((t) => t.id === tripId) ?? null,
    [trips, tripId],
  );

  const [endKm, setEndKm] = useState('');
  const [earnings, setEarnings] = useState('');
  const [completing, setCompleting] = useState(false);

  if (!trip) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.notFound}>Sefer bulunamadı</Text>
          <Button label="Geri" onPress={() => router.back()} variant="ghost" />
        </View>
      </SafeAreaView>
    );
  }

  const isActive = trip.status === 'active';
  const duration =
    trip.startTime && trip.endTime
      ? calculateTripDuration(trip.startTime, trip.endTime)
      : null;

  const handleComplete = async () => {
    const endKmNum = parseFloat(endKm);
    const earningsNum = parseFloat(earnings);
    if (isNaN(endKmNum) || endKmNum <= trip.startKm) {
      Alert.alert('Geçersiz KM', `Bitiş km, başlangıç km'den (${trip.startKm}) büyük olmalı.`);
      return;
    }
    if (isNaN(earningsNum) || earningsNum < 0) {
      Alert.alert('Geçersiz Kazanç', 'Lütfen geçerli bir kazanç değeri girin.');
      return;
    }
    setCompleting(true);
    try {
      const now = Math.floor(Date.now() / 1000);
      await completeTrip(tripId, endKmNum, now, earningsNum);
      Alert.alert('Sefer Tamamlandı', 'Sefer başarıyla kapatıldı!');
    } catch (e) {
      Alert.alert('Hata', String(e));
    } finally {
      setCompleting(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Seferi İptal Et',
      'Bu seferi iptal etmek istediğinden emin misin?',
      [
        { text: 'Hayır', style: 'cancel' },
        {
          text: 'Evet, İptal Et',
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
      'Seferi Sil',
      'Bu sefer kalıcı olarak silinecek. Emin misin?',
      [
        { text: 'Hayır', style: 'cancel' },
        {
          text: 'Evet, Sil',
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
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Route */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Rota</Text>
          <View style={styles.routeRow}>
            <View style={styles.routePoint}>
              <Text style={styles.routeLabel}>Kalkış</Text>
              <Text style={styles.routeValue}>{trip.origin}</Text>
            </View>
            <Text style={styles.arrow}>→</Text>
            <View style={styles.routePoint}>
              <Text style={styles.routeLabel}>Varış</Text>
              <Text style={styles.routeValue}>{trip.destination}</Text>
            </View>
          </View>
        </Card>

        {/* Details */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Detaylar</Text>
          <DetailRow label="Başlangıç" value={formatDateTime(trip.startTime)} />
          {trip.endTime ? (
            <DetailRow label="Bitiş" value={formatDateTime(trip.endTime)} />
          ) : null}
          <DetailRow label="Başlangıç KM" value={formatKm(trip.startKm)} />
          {trip.endKm != null && (
            <DetailRow label="Bitiş KM" value={formatKm(trip.endKm)} />
          )}
          {trip.distanceKm != null && (
            <DetailRow label="Mesafe" value={formatKm(trip.distanceKm)} />
          )}
          {duration ? (
            <DetailRow label="Süre" value={duration.display} />
          ) : null}
          {trip.earnings != null && (
            <DetailRow
              label="Kazanç"
              value={formatCurrency(trip.earnings)}
              valueColor="#22C55E"
            />
          )}
          {trip.notes ? (
            <DetailRow label="Not" value={trip.notes} />
          ) : null}
        </Card>

        {/* Complete Form */}
        {isActive ? (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Seferi Tamamla</Text>
            <Input
              label="Bitiş KM *"
              placeholder={`${trip.startKm} km'den büyük olmalı`}
              value={endKm}
              onChangeText={setEndKm}
              keyboardType="numeric"
              suffix="km"
            />
            <Input
              label="Kazanç *"
              placeholder="Bu seferden kazandığın tutar"
              value={earnings}
              onChangeText={setEarnings}
              keyboardType="numeric"
              suffix="₺"
            />
            <Button
              label="✅ Seferi Tamamla"
              onPress={handleComplete}
              loading={completing}
            />
            <Button
              label="Seferi İptal Et"
              onPress={handleCancel}
              variant="danger"
            />
          </Card>
        ) : null}

        {/* Delete */}
        {!isActive ? (
          <Button
            label="🗑️ Seferi Sil"
            onPress={handleDelete}
            variant="danger"
          />
        ) : null}
      </ScrollView>
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

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Card } from './ui/Card';
import { formatCurrency, formatKm, formatDuration, formatDateTime } from '@utils/formatters';
import type { Trip } from '@/types';

interface TripCardProps {
  trip: Trip;
  onPress?: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  active: '#22C55E',
  completed: '#3B82F6',
  cancelled: '#EF4444',
};

export function TripCard({ trip, onPress }: TripCardProps) {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const statusColor = STATUS_COLORS[trip.status] ?? '#94A3B8';

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/trip/${trip.id}`);
    }
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.85}>
      <Card style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.route}>
            <Text style={styles.origin} numberOfLines={1}>
              {trip.origin}
            </Text>
            <Text style={styles.arrow}>→</Text>
            <Text style={styles.destination} numberOfLines={1}>
              {trip.destination}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {t(`tripStatus.${trip.status}`)}
            </Text>
          </View>
        </View>

        {/* Details */}
        <View style={styles.details}>
          <DetailItem
            label={t('tripDetail.start')}
            value={formatDateTime(trip.startTime, i18n.language)}
          />
          {trip.distanceKm != null && (
            <DetailItem label={t('tripDetail.distance')} value={formatKm(trip.distanceKm)} />
          )}
          {trip.durationMinutes != null && (
            <DetailItem
              label={t('tripDetail.duration')}
              value={formatDuration(trip.durationMinutes, i18n.language)}
            />
          )}
          {trip.earnings != null && (
            <DetailItem
              label={t('tripDetail.earnings')}
              value={formatCurrency(trip.earnings, trip.currency)}
              valueColor="#22C55E"
            />
          )}
        </View>

        {trip.notes ? (
          <Text style={styles.notes} numberOfLines={2}>
            {trip.notes}
          </Text>
        ) : null}
      </Card>
    </TouchableOpacity>
  );
}

function DetailItem({
  label,
  value,
  valueColor = '#F1F5F9',
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.detailItem}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, { color: valueColor }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: 12 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  route: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  origin: { color: '#F1F5F9', fontWeight: '600', fontSize: 14, flex: 1 },
  arrow: { color: '#64748B', fontSize: 14 },
  destination: { color: '#F1F5F9', fontWeight: '600', fontSize: 14, flex: 1 },
  statusBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusText: { fontSize: 11, fontWeight: '600' },
  details: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailItem: { gap: 2 },
  detailLabel: { color: '#64748B', fontSize: 11 },
  detailValue: { fontSize: 13, fontWeight: '600' },
  notes: { color: '#64748B', fontSize: 12, fontStyle: 'italic' },
});

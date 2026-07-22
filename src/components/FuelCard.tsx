import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from './ui/Card';
import { formatCurrency, formatLiters, formatDate, formatKm } from '@utils/formatters';
import { useFuelStore } from '@stores/fuelStore';
import type { FuelEntry } from '@types/index';

interface FuelCardProps {
  entry: FuelEntry;
}

export function FuelCard({ entry }: FuelCardProps) {
  const { deleteFuelEntry } = useFuelStore();

  const handleDelete = () => {
    Alert.alert(
      'Kaydı Sil',
      `${entry.stationName ?? 'Bu yakıt kaydını'} silmek istediğinize emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: () => deleteFuelEntry(entry.id),
        },
      ],
    );
  };

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.stationName}>
            {entry.stationName ?? 'İstasyon'}
          </Text>
          <Text style={styles.date}>{formatDate(entry.date)}</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.totalCost}>{formatCurrency(entry.totalCost)}</Text>
          <TouchableOpacity
            onPress={handleDelete}
            style={styles.deleteBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="trash-outline" size={16} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.details}>
        <DetailItem
          icon="⛽"
          label="Miktar"
          value={formatLiters(entry.liters)}
        />
        <DetailItem
          icon="💰"
          label="Litre Fiyatı"
          value={formatCurrency(entry.pricePerLiter)}
        />
        {entry.currentKm != null && (
          <DetailItem
            icon="🛣️"
            label="Güncel KM"
            value={formatKm(entry.currentKm)}
          />
        )}
      </View>

      {entry.notes ? (
        <Text style={styles.notes} numberOfLines={2}>
          {entry.notes}
        </Text>
      ) : null}
    </Card>
  );
}

function DetailItem({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.detailItem}>
      <Text style={styles.detailIcon}>{icon}</Text>
      <View>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: 12 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerLeft: { flex: 1 },
  headerRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  stationName: { color: '#F1F5F9', fontWeight: '600', fontSize: 15 },
  date: { color: '#64748B', fontSize: 12, marginTop: 2 },
  totalCost: { color: '#EF4444', fontWeight: '700', fontSize: 18 },
  deleteBtn: {
    padding: 4,
  },
  details: { flexDirection: 'row', gap: 16 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailIcon: { fontSize: 16 },
  detailLabel: { color: '#64748B', fontSize: 11 },
  detailValue: { color: '#F1F5F9', fontWeight: '600', fontSize: 13 },
  notes: { color: '#64748B', fontSize: 12, fontStyle: 'italic' },
});

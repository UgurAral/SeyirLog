import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Card } from './ui/Card';
import { formatCurrency, formatLiters, formatDate, formatKm } from '@utils/formatters';
import { useFuelStore } from '@stores/fuelStore';
import { useDistanceUnitStore } from '@stores/distanceUnitStore';
import { useTheme } from '@/theme/useTheme';
import type { ColorTokens } from '@/theme/colors';
import type { FuelEntry } from '@/types';

interface FuelCardProps {
  entry: FuelEntry;
}

export function FuelCard({ entry }: FuelCardProps) {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const distanceUnit = useDistanceUnitStore((s) => s.unit);
  const { deleteFuelEntry } = useFuelStore();

  const handleDelete = () => {
    Alert.alert(
      t('card.deleteConfirmTitle'),
      `${entry.stationName ?? t('card.fuelDefaultName')} ${t('card.fuelDeleteBody')}`,
      [
        { text: t('card.cancel'), style: 'cancel' },
        {
          text: t('card.delete'),
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
            {entry.stationName ?? t('card.station')}
          </Text>
          <Text style={styles.date}>{formatDate(entry.date, i18n.language)}</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.totalCost}>{formatCurrency(entry.totalCost, entry.currency)}</Text>
          <TouchableOpacity
            onPress={handleDelete}
            style={styles.deleteBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="trash-outline" size={16} color={colors.danger} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.details}>
        {entry.liters > 0 && (
          <DetailItem
            icon="⛽"
            label={t('card.amount')}
            value={formatLiters(entry.liters)}
          />
        )}
        {entry.pricePerLiter > 0 && (
          <DetailItem
            icon="💰"
            label={t('card.literPrice')}
            value={formatCurrency(entry.pricePerLiter, entry.currency)}
          />
        )}
        {entry.currentKm != null && (
          <DetailItem
            icon="🛣️"
            label={t('card.currentKm')}
            value={formatKm(entry.currentKm, distanceUnit)}
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
  const { colors } = useTheme();
  const styles = createStyles(colors);
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

function createStyles(colors: ColorTokens) {
  return StyleSheet.create({
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
    stationName: { color: colors.textPrimary, fontWeight: '600', fontSize: 15 },
    date: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
    totalCost: { color: colors.danger, fontWeight: '700', fontSize: 18 },
    deleteBtn: {
      padding: 4,
    },
    details: { flexDirection: 'row', gap: 16 },
    detailItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    detailIcon: { fontSize: 16 },
    detailLabel: { color: colors.textMuted, fontSize: 11 },
    detailValue: { color: colors.textPrimary, fontWeight: '600', fontSize: 13 },
    notes: { color: colors.textMuted, fontSize: 12, fontStyle: 'italic' },
  });
}

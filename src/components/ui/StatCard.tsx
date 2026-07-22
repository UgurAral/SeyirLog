import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { Card } from './Card';

interface StatCardProps {
  label: string;
  value: string;
  subValue?: string;
  icon?: string;
  accentColor?: string;
  style?: ViewStyle;
}

export function StatCard({
  label,
  value,
  subValue,
  icon,
  accentColor = '#3B82F6',
  style,
}: StatCardProps) {
  return (
    <Card style={[styles.card, style]}>
      <View style={styles.header}>
        {icon ? (
          <View style={[styles.iconWrapper, { backgroundColor: accentColor + '20' }]}>
            <Text style={styles.icon}>{icon}</Text>
          </View>
        ) : null}
        <Text style={styles.label}>{label}</Text>
      </View>
      <Text style={[styles.value, { color: accentColor }]}>{value}</Text>
      {subValue ? <Text style={styles.subValue}>{subValue}</Text> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 8, flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 16 },
  label: { color: '#94A3B8', fontSize: 12, fontWeight: '500', flex: 1 },
  value: { fontSize: 22, fontWeight: '700' },
  subValue: { color: '#64748B', fontSize: 12 },
});

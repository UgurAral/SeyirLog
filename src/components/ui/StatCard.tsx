import React from 'react';
import { View, Text, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import { Card } from './Card';
import { useTheme } from '@/theme/useTheme';
import type { ColorTokens } from '@/theme/colors';

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  subValue?: string;
  icon?: string;
  accentColor?: string;
  style?: StyleProp<ViewStyle>;
}

export function StatCard({
  label,
  value,
  subValue,
  icon,
  accentColor,
  style,
}: StatCardProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const resolvedAccent = accentColor ?? colors.accent;
  return (
    <Card style={[styles.card, style]}>
      <View style={styles.header}>
        {icon ? (
          <View style={[styles.iconWrapper, { backgroundColor: resolvedAccent + '20' }]}>
            <Text style={styles.icon}>{icon}</Text>
          </View>
        ) : null}
        <Text style={styles.label}>{label}</Text>
      </View>
      {typeof value === 'string' ? (
        <Text style={[styles.value, { color: resolvedAccent }]}>{value}</Text>
      ) : (
        value
      )}
      {subValue ? <Text style={styles.subValue}>{subValue}</Text> : null}
    </Card>
  );
}

function createStyles(colors: ColorTokens) {
  return StyleSheet.create({
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
    label: { color: colors.textSecondary, fontSize: 12, fontWeight: '500', flex: 1 },
    value: { fontSize: 22, fontWeight: '700' },
    subValue: { color: colors.textMuted, fontSize: 12 },
  });
}

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { PERIOD_LABELS } from '@utils/dateHelpers';

export type Period = 'today' | 'week' | 'month' | 'all';

const PERIOD_OPTIONS: Period[] = ['today', 'week', 'month', 'all'];

export interface PeriodFilterProps {
  selected: Period;
  onChange: (period: Period) => void;
}

export function PeriodFilter({ selected, onChange }: PeriodFilterProps) {
  return (
    <View style={styles.container}>
      {PERIOD_OPTIONS.map((period) => {
        const isActive = period === selected;
        return (
          <TouchableOpacity
            key={period}
            style={[styles.tab, isActive && styles.tabActive]}
            onPress={() => onChange(period)}
            activeOpacity={0.75}
          >
            <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
              {PERIOD_LABELS[period]}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 4,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: '#3B82F6',
  },
  tabText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
});

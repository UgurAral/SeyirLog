import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Input } from './Input';
import { formatKm } from '@utils/formatters';
import { kmToDisplay, displayToKm, type DistanceUnit } from '@stores/distanceUnitStore';
import { useTheme } from '@/theme/useTheme';
import type { ColorTokens } from '@/theme/colors';

interface OdometerRowProps {
  label: string;
  valueKm: number | null;
  distanceUnit: DistanceUnit;
  onSave: (km: number | null) => Promise<void> | void;
}

/**
 * Aracın km sayacı değerini gösterip düzenlemeye izin veren satır — Dashboard'daki
 * aktif gün kartında (başlangıç km) ve Günün Özeti'nde (başlangıç+bitiş km)
 * kullanılır. Değer her zaman km olarak DB'ye yazılır, gösterim/giriş seçili
 * mesafe birimine göre çevrilir.
 */
export function OdometerRow({ label, valueKm, distanceUnit, onSave }: OdometerRowProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);

  const startEdit = () => {
    setDraft(valueKm != null ? String(kmToDisplay(valueKm, distanceUnit)) : '');
    setEditing(true);
  };

  const handleSave = async () => {
    const trimmed = draft.trim();
    const num = trimmed ? parseFloat(trimmed) : NaN;
    if (trimmed && (isNaN(num) || num < 0)) return;
    setSaving(true);
    try {
      await onSave(trimmed ? displayToKm(num, distanceUnit) : null);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <View style={styles.editRow}>
        <Input
          label={label}
          value={draft}
          onChangeText={setDraft}
          keyboardType="numeric"
          suffix={distanceUnit}
          containerStyle={styles.editInput}
          autoFocus
        />
        <TouchableOpacity
          style={[styles.iconBtn, styles.saveBtn]}
          onPress={handleSave}
          disabled={saving}
          hitSlop={8}
        >
          <Ionicons name="checkmark" size={18} color={colors.onAccent} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.iconBtn, styles.cancelBtn]}
          onPress={() => setEditing(false)}
          disabled={saving}
          hitSlop={8}
        >
          <Ionicons name="close" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TouchableOpacity style={styles.row} onPress={startEdit} activeOpacity={0.7}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowRight}>
        <Text style={styles.rowValue}>
          {valueKm != null ? formatKm(valueKm, distanceUnit) : t('common.notSet')}
        </Text>
        <Ionicons name="pencil" size={14} color={colors.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

function createStyles(colors: ColorTokens) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    rowLabel: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
    rowRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    rowValue: { color: colors.textPrimary, fontSize: 13, fontWeight: '700' },
    editRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
    editInput: { flex: 1 },
    iconBtn: {
      width: 40,
      height: 48,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    saveBtn: { backgroundColor: colors.accent },
    cancelBtn: { backgroundColor: colors.surface },
  });
}

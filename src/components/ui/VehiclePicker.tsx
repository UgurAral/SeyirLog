import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useVehicles } from '@hooks/useVehicles';
import { BottomSheet, BottomSheetDivider } from './BottomSheet';
import { useTheme } from '@/theme/useTheme';
import type { ColorTokens } from '@/theme/colors';
import type { Vehicle } from '@/types';

interface VehiclePickerProps {
  /** İsteğe bağlı ek stil */
  style?: object;
}

function formatVehicleLabel(vehicle: Vehicle): string {
  const base = `${vehicle.brand} ${vehicle.model}`;
  return vehicle.plate ? `${base} · ${vehicle.plate}` : base;
}

/**
 * Birden fazla araç varken aktif aracı seçmek için küçük bir picker.
 * Dashboard header'ında kullanılır.
 */
export function VehiclePicker({ style }: VehiclePickerProps) {
  const { t } = useTranslation();
  const { vehicles, activeVehicle, setActiveVehicle } = useVehicles();
  const [visible, setVisible] = useState(false);
  const { colors } = useTheme();
  const styles = createStyles(colors);

  // Tek araç veya hiç araç yoksa — sadece isim göster, dropdown yok
  if (vehicles.length <= 1) {
    if (!activeVehicle) return null;
    return (
      <View style={[styles.labelOnly, style]}>
        <Text style={styles.vehicleLabel} numberOfLines={1}>
          {formatVehicleLabel(activeVehicle)}
        </Text>
      </View>
    );
  }

  const handleSelect = (vehicle: Vehicle) => {
    setActiveVehicle(vehicle);
    setVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.trigger, style]}
        onPress={() => setVisible(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.vehicleLabel} numberOfLines={1}>
          {activeVehicle ? formatVehicleLabel(activeVehicle) : t('vehicle.pickerTitle')}
        </Text>
        <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
      </TouchableOpacity>

      <BottomSheet visible={visible} onClose={() => setVisible(false)} title={t('vehicle.pickerTitle')}>
        <FlatList
          data={vehicles}
          keyExtractor={(item) => String(item.id)}
          ItemSeparatorComponent={BottomSheetDivider}
          renderItem={({ item }) => {
            const isActive = item.id === activeVehicle?.id;
            return (
              <TouchableOpacity
                style={styles.optionRow}
                onPress={() => handleSelect(item)}
                activeOpacity={0.75}
              >
                <View style={styles.optionInfo}>
                  <Text style={[styles.optionName, isActive && styles.optionNameActive]}>
                    {item.brand} {item.model}
                  </Text>
                  {item.plate ? (
                    <Text style={styles.optionPlate}>{item.plate}</Text>
                  ) : null}
                </View>
                {isActive && (
                  <Ionicons name="checkmark-circle" size={20} color={colors.accent} />
                )}
              </TouchableOpacity>
            );
          }}
        />
      </BottomSheet>
    </>
  );
}

function createStyles(colors: ColorTokens) {
  return StyleSheet.create({
    labelOnly: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    vehicleLabel: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: '500',
      flexShrink: 1,
    },
    trigger: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.surface,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderWidth: 1,
      borderColor: colors.border,
      maxWidth: 220,
    },
    optionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 14,
      paddingHorizontal: 4,
    },
    optionInfo: { gap: 2, flex: 1 },
    optionName: { color: colors.textPrimary, fontSize: 15, fontWeight: '600' },
    optionNameActive: { color: colors.accent },
    optionPlate: { color: colors.textMuted, fontSize: 12, letterSpacing: 0.5 },
  });
}

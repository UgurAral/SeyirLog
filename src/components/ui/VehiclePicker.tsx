import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVehicles } from '@hooks/useVehicles';
import type { Vehicle } from '@types/index';

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
  const { vehicles, activeVehicle, setActiveVehicle } = useVehicles();
  const [visible, setVisible] = useState(false);

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
          {activeVehicle ? formatVehicleLabel(activeVehicle) : 'Araç Seç'}
        </Text>
        <Ionicons name="chevron-down" size={14} color="#94A3B8" />
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Araç Seç</Text>
            <FlatList
              data={vehicles}
              keyExtractor={(item) => String(item.id)}
              ItemSeparatorComponent={() => <View style={styles.divider} />}
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
                      <Ionicons name="checkmark-circle" size={20} color="#3B82F6" />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  labelOnly: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleLabel: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '500',
    flexShrink: 1,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1E293B',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#334155',
    maxWidth: 220,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    paddingBottom: 32,
    gap: 12,
  },
  sheetTitle: {
    color: '#F1F5F9',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  divider: { height: 1, backgroundColor: '#334155' },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  optionInfo: { gap: 2, flex: 1 },
  optionName: { color: '#CBD5E1', fontSize: 15, fontWeight: '600' },
  optionNameActive: { color: '#3B82F6' },
  optionPlate: { color: '#64748B', fontSize: 12, letterSpacing: 0.5 },
});

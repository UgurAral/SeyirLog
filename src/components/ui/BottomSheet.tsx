import React from 'react';
import { View, Text, Modal, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/useTheme';
import type { ColorTokens } from '@/theme/colors';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

/**
 * Alttan açılan seçim sayfası — VehiclePicker, LanguagePicker,
 * CurrencyBreakdownValue ve Profil'deki para birimi seçicideki neredeyse
 * birebir aynı overlay/sheet/başlık iskeletini tek yerde toplar. İçerik
 * (genelde bir FlatList) `children` olarak verilir.
 */
export function BottomSheet({ visible, onClose, title, children }: BottomSheetProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>{title}</Text>
          {children}
        </View>
      </Pressable>
    </Modal>
  );
}

/** BottomSheet içindeki FlatList'lerde ItemSeparatorComponent olarak kullanılır. */
export function BottomSheetDivider() {
  const { colors } = useTheme();
  return <View style={{ height: 1, backgroundColor: colors.border }} />;
}

function createStyles(colors: ColorTokens) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 16,
      paddingBottom: 32,
      gap: 12,
    },
    sheetTitle: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: '700',
      textAlign: 'center',
      marginBottom: 4,
    },
  });
}

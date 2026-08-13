import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, StyleProp, ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { LANGUAGE_OPTIONS, changeLanguage, type SupportedLanguage } from '@/i18n';
import { BottomSheet, BottomSheetDivider } from '@components/ui/BottomSheet';
import { useTheme } from '@/theme/useTheme';
import type { ColorTokens } from '@/theme/colors';

interface LanguagePickerProps {
  /** Sadece bayrak + kısaltma (TR/EN/...) gösterir — dar alanlar için (örn. giriş ekranı). */
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function LanguagePicker({ compact = false, style }: LanguagePickerProps) {
  const { t, i18n } = useTranslation();
  const [visible, setVisible] = useState(false);
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const current = LANGUAGE_OPTIONS.find((o) => o.code === i18n.language) ?? LANGUAGE_OPTIONS[0];

  return (
    <>
      <TouchableOpacity
        style={[styles.trigger, compact && styles.triggerCompact, style]}
        onPress={() => setVisible(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.flag}>{current.flag}</Text>
        <Text style={[styles.triggerText, compact && styles.triggerTextCompact]}>
          {compact ? current.code.toUpperCase() : current.name}
        </Text>
        <Ionicons name="chevron-down" size={compact ? 14 : 16} color={colors.textSecondary} />
      </TouchableOpacity>

      <BottomSheet visible={visible} onClose={() => setVisible(false)} title={t('language.title')}>
        <FlatList
          data={LANGUAGE_OPTIONS}
          keyExtractor={(item) => item.code}
          ItemSeparatorComponent={BottomSheetDivider}
          renderItem={({ item }) => {
            const isSelected = i18n.language === item.code;
            return (
              <TouchableOpacity
                style={styles.optionRow}
                onPress={() => {
                  changeLanguage(item.code as SupportedLanguage);
                  setVisible(false);
                }}
                activeOpacity={0.75}
              >
                <Text style={styles.flag}>{item.flag}</Text>
                <Text style={[styles.optionName, isSelected && styles.optionNameActive]}>
                  {item.name}
                </Text>
                {isSelected && <Ionicons name="checkmark-circle" size={20} color={colors.accent} />}
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
    trigger: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: colors.background,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    triggerCompact: {
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 7,
      borderRadius: 20,
      backgroundColor: colors.chipTranslucent,
    },
    flag: { fontSize: 20 },
    triggerText: { color: colors.textPrimary, fontSize: 15, fontWeight: '600' },
    triggerTextCompact: { fontSize: 13 },

    optionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 4 },
    optionName: { flex: 1, color: colors.textPrimary, fontSize: 15, fontWeight: '600' },
    optionNameActive: { color: colors.accent },
  });
}

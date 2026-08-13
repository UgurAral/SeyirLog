import React from 'react';
import { TouchableOpacity, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@stores/themeStore';
import { useTheme } from '@/theme/useTheme';
import type { ColorTokens } from '@/theme/colors';

interface ThemeToggleProps {
  style?: StyleProp<ViewStyle>;
}

/**
 * Açık/koyu mod arasında doğrudan geçiş yapan küçük ikon buton — "sistem"
 * seçeneği yok, sadece iki durum arasında aç/kapa. Giriş ekranı gibi
 * kullanıcının henüz oturum açmadığı, Profil'deki 3'lü tema seçiciye
 * erişemediği yerler için.
 */
export function ThemeToggle({ style }: ThemeToggleProps) {
  const { colors, isDark } = useTheme();
  const setMode = useThemeStore((s) => s.setMode);
  const styles = createStyles(colors);

  return (
    <TouchableOpacity
      style={[styles.toggle, style]}
      onPress={() => setMode(isDark ? 'light' : 'dark')}
      activeOpacity={0.8}
      hitSlop={8}
    >
      <Ionicons name={isDark ? 'moon' : 'sunny'} size={16} color={colors.textPrimary} />
    </TouchableOpacity>
  );
}

function createStyles(colors: ColorTokens) {
  return StyleSheet.create({
    toggle: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.chipTranslucent,
    },
  });
}

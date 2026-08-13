import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useTheme } from '@/theme/useTheme';
import type { ColorTokens } from '@/theme/colors';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.base,
        styles[variant],
        styles[size],
        isDisabled && styles.disabled,
        style,
      ]}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'ghost' ? colors.accent : colors.onAccent}
          size="small"
        />
      ) : (
        <Text style={[styles.text, styles[`${variant}Text`], textStyle]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

function createStyles(colors: ColorTokens) {
  return StyleSheet.create({
    base: {
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    },
    // Variants
    primary: { backgroundColor: colors.accent },
    secondary: { backgroundColor: colors.textMuted },
    danger: { backgroundColor: colors.danger },
    ghost: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.accent,
    },
    // Sizes
    sm: { paddingVertical: 6, paddingHorizontal: 12 },
    md: { paddingVertical: 12, paddingHorizontal: 20 },
    lg: { paddingVertical: 16, paddingHorizontal: 28 },
    // Disabled
    disabled: { opacity: 0.5 },
    // Text
    text: { fontWeight: '600', fontSize: 15 },
    primaryText: { color: colors.onAccent },
    secondaryText: { color: colors.onAccent },
    dangerText: { color: colors.onAccent },
    ghostText: { color: colors.accent },
  });
}

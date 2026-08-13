import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '@/theme/useTheme';
import type { ColorTokens } from '@/theme/colors';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  hint?: string;
  prefix?: string;
  suffix?: string;
  containerStyle?: ViewStyle;
}

export function Input({
  label,
  error,
  hint,
  prefix,
  suffix,
  containerStyle,
  ...props
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View
        style={[
          styles.inputWrapper,
          focused && styles.inputWrapperFocused,
          error ? styles.inputWrapperError : null,
        ]}
      >
        {prefix ? <Text style={styles.affix}>{prefix}</Text> : null}
        <TextInput
          {...props}
          style={styles.input}
          placeholderTextColor={colors.textMuted}
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
        />
        {suffix ? <Text style={styles.affix}>{suffix}</Text> : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!error && hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

function createStyles(colors: ColorTokens) {
  return StyleSheet.create({
    container: { gap: 4 },
    label: { color: colors.textSecondary, fontSize: 13, fontWeight: '500' },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 12,
      minHeight: 48,
    },
    inputWrapperFocused: { borderColor: colors.accent },
    inputWrapperError: { borderColor: colors.danger },
    input: {
      flex: 1,
      color: colors.textPrimary,
      fontSize: 15,
      paddingVertical: 10,
    },
    affix: { color: colors.textSecondary, fontSize: 14, marginHorizontal: 4 },
    error: { color: colors.danger, fontSize: 12 },
    hint: { color: colors.textMuted, fontSize: 12 },
  });
}

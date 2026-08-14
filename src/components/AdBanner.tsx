import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { AD_UNITS, ADS_DISABLED } from '@utils/ads';
import { useTheme } from '@/theme/useTheme';
import type { ColorTokens } from '@/theme/colors';

interface AdBannerProps {
  position: 'top' | 'bottom';
}

export function AdBanner({ position }: AdBannerProps) {
  const unitId = position === 'top' ? AD_UNITS.BANNER_TOP : AD_UNITS.BANNER_BOTTOM;
  if (ADS_DISABLED) return null;
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={[styles.wrap, position === 'top' ? styles.top : styles.bottom]}>
      <BannerAd
        unitId={unitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
      />
    </View>
  );
}

function createStyles(colors: ColorTokens) {
  return StyleSheet.create({
    wrap: {
      width: '100%',
      alignItems: 'center',
      backgroundColor: colors.background,
      zIndex: 10,
    },
    top:    { borderBottomWidth: 1, borderBottomColor: colors.surface },
    bottom: { borderTopWidth: 1, borderTopColor: colors.surface },
  });
}

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { AD_UNITS } from '@utils/ads';

interface AdBannerProps {
  position: 'top' | 'bottom';
}

export function AdBanner({ position }: AdBannerProps) {
  const unitId = position === 'top' ? AD_UNITS.BANNER_TOP : AD_UNITS.BANNER_BOTTOM;

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

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    zIndex: 10,
  },
  top:    { borderBottomWidth: 1, borderBottomColor: '#1E293B' },
  bottom: { borderTopWidth: 1, borderTopColor: '#1E293B' },
});

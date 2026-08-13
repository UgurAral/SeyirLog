import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useOnboardingStore } from '@stores/onboardingStore';
import { useTheme } from '@/theme/useTheme';
import type { ColorTokens } from '@/theme/colors';

interface Step {
  icon: string;
  titleKey: string;
  bodyKey: string;
}

const STEPS: Step[] = [
  { icon: '🚖', titleKey: 'onboarding.step1Title', bodyKey: 'onboarding.step1Body' },
  { icon: '⛽', titleKey: 'onboarding.step2Title', bodyKey: 'onboarding.step2Body' },
  { icon: '💰', titleKey: 'onboarding.step3Title', bodyKey: 'onboarding.step3Body' },
  { icon: '📊', titleKey: 'onboarding.step4Title', bodyKey: 'onboarding.step4Body' },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { completeOnboarding } = useOnboardingStore();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [stepIndex, setStepIndex] = useState(0);

  const isLast = stepIndex === STEPS.length - 1;
  const step = STEPS[stepIndex];

  const handleFinish = async () => {
    await completeOnboarding();
    router.replace('/(tabs)');
  };

  const handleNext = () => {
    if (isLast) {
      handleFinish();
    } else {
      setStepIndex((i) => i + 1);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.topRow}>
        <View style={styles.dots}>
          {STEPS.map((_, i) => (
            <View key={i} style={[styles.dot, i === stepIndex && styles.dotActive]} />
          ))}
        </View>
        <TouchableOpacity onPress={handleFinish} hitSlop={12}>
          <Text style={styles.skipText}>{t('onboarding.skip')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.icon}>{step.icon}</Text>
        <Text style={styles.title}>{t(step.titleKey)}</Text>
        <Text style={styles.body}>{t(step.bodyKey)}</Text>
      </View>

      <View style={styles.bottom}>
        {stepIndex > 0 && (
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => setStepIndex((i) => i - 1)}
            activeOpacity={0.8}
          >
            <Text style={styles.backBtnText}>{t('onboarding.back')}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.85}>
          <Text style={styles.nextBtnText}>
            {isLast ? t('onboarding.getStarted') : t('onboarding.next')}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function createStyles(colors: ColorTokens) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    topRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 8,
    },
    dots: { flexDirection: 'row', gap: 6 },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
    dotActive: { backgroundColor: colors.accent, width: 20 },
    skipText: { color: colors.textMuted, fontSize: 14, fontWeight: '600' },

    content: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
      gap: 16,
    },
    icon: { fontSize: 80, marginBottom: 8 },
    title: { color: colors.textPrimary, fontSize: 24, fontWeight: '800', textAlign: 'center' },
    body: { color: colors.textSecondary, fontSize: 15, textAlign: 'center', lineHeight: 22 },

    bottom: {
      flexDirection: 'row',
      gap: 12,
      paddingHorizontal: 20,
      paddingBottom: 12,
    },
    backBtn: {
      flex: 1,
      paddingVertical: 15,
      borderRadius: 14,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    backBtnText: { color: colors.textSecondary, fontWeight: '700', fontSize: 15 },
    nextBtn: {
      flex: 2,
      backgroundColor: colors.accent,
      paddingVertical: 15,
      borderRadius: 14,
      alignItems: 'center',
    },
    nextBtnText: { color: colors.onAccent, fontWeight: '700', fontSize: 15 },
  });
}

import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { useVehicles } from '@hooks/useVehicles';
import { exportBackup, importBackup } from '@utils/backup';
import { signOut } from '@services/auth';
import { useCurrencyStore, type SupportedCurrency } from '@stores/currencyStore';
import { useCurrencyOptions } from '@/i18n/options';
import { AdBanner } from '@components/AdBanner';
import { LanguagePicker } from '@components/LanguagePicker';
import { BottomSheet, BottomSheetDivider } from '@components/ui/BottomSheet';
import { submitFeedback } from '@services/firestore';
import { useTabTitle } from '@hooks/useTabTitle';
import { useThemeStore, type ThemeMode } from '@stores/themeStore';
import { useDistanceUnitStore, type DistanceUnit } from '@stores/distanceUnitStore';
import { useTheme } from '@/theme/useTheme';
import type { ColorTokens } from '@/theme/colors';
import type { Vehicle } from '@/types';

export default function ProfileScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  useTabTitle(t('tabs.profile'));
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { mode: themeMode, setMode: setThemeMode } = useThemeStore();
  const { unit: distanceUnit, setDistanceUnit } = useDistanceUnitStore();
  const { vehicles, activeVehicle, isLoading, error, setActiveVehicle, fetchVehicles } =
    useVehicles();
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [currencyPickerVisible, setCurrencyPickerVisible] = useState(false);
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSending, setFeedbackSending] = useState(false);
  const { currency, setCurrency } = useCurrencyStore();
  const currencyOptions = useCurrencyOptions();
  const currentCurrency = currencyOptions.find((o) => o.code === currency) ?? currencyOptions[0];

  const THEME_MODES: { id: ThemeMode; label: string }[] = [
    { id: 'system', label: t('theme.system') },
    { id: 'light', label: t('theme.light') },
    { id: 'dark', label: t('theme.dark') },
  ];

  const DISTANCE_UNITS: { id: DistanceUnit; label: string }[] = [
    { id: 'km', label: t('distanceUnit.km') },
    { id: 'mi', label: t('distanceUnit.mi') },
  ];

  const handleExport = async () => {
    setBackupLoading(true);
    const result = await exportBackup();
    setBackupLoading(false);
    if (!result.success) Alert.alert(t('common.error'), result.message);
  };

  const handleImport = async () => {
    Alert.alert(
      t('profile.restoreConfirmTitle'),
      t('profile.restoreConfirmBody'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('profile.restoreConfirmButton'),
          style: 'destructive',
          onPress: async () => {
            setRestoreLoading(true);
            const result = await importBackup();
            setRestoreLoading(false);
            if (result.success) {
              fetchVehicles();
              Alert.alert(
                t('profile.restoreDoneTitle'),
                `${t('profile.restoreDoneVehicle')}: ${result.counts?.vehicles ?? 0}\n` +
                `${t('profile.restoreDoneTrip')}: ${result.counts?.trips ?? 0}\n` +
                `${t('profile.restoreDoneFuel')}: ${result.counts?.fuelEntries ?? 0}\n` +
                `${t('profile.restoreDoneExpense')}: ${result.counts?.expenses ?? 0}\n` +
                `${t('profile.restoreDoneIncome')}: ${result.counts?.incomeEntries ?? 0}`,
              );
            } else {
              Alert.alert(t('common.error'), result.message);
            }
          },
        },
      ],
    );
  };

  const handleSendFeedback = async () => {
    const trimmed = feedbackText.trim();
    if (!trimmed) return;
    setFeedbackSending(true);
    try {
      await submitFeedback(trimmed);
      setFeedbackText('');
      setFeedbackVisible(false);
      Alert.alert(t('profile.feedbackSentTitle'), t('profile.feedbackSentBody'));
    } catch (e) {
      Alert.alert(t('common.error'), String(e));
    } finally {
      setFeedbackSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AdBanner position="top" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Başlık */}
        <View style={styles.headerRow}>
          <Text style={styles.title}>{t('vehicle.myVehicles')}</Text>
          <Button
            label={t('vehicle.addVehicle')}
            onPress={() => router.push('/vehicle/new')}
            size="sm"
          />
        </View>

        {/* Yükleniyor */}
        {isLoading && (
          <View style={styles.center}>
            <ActivityIndicator color={colors.accent} />
            <Text style={styles.loadingText}>{t('vehicle.loadingVehicles')}</Text>
          </View>
        )}

        {/* Hata */}
        {error && !isLoading && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
          </View>
        )}

        {/* Boş Liste */}
        {!isLoading && !error && vehicles.length === 0 && (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>{t('vehicle.noVehiclesTitle')}</Text>
            <Text style={styles.emptySubtitle}>
              {t('vehicle.noVehiclesText')}
            </Text>
            <Button
              label={t('vehicle.addFirstVehicle')}
              onPress={() => router.push('/vehicle/new')}
            />
          </Card>
        )}

        {/* Araç Listesi */}
        {vehicles.length > 0 && (
          <View style={styles.vehicleList}>
            {vehicles.map((vehicle) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                isActive={activeVehicle?.id === vehicle.id}
                onPress={() => router.push(`/vehicle/${vehicle.id}`)}
                onSetActive={() => setActiveVehicle(vehicle)}
              />
            ))}
          </View>
        )}

        {/* Vardiya Geçmişi */}
        <TouchableOpacity
          style={styles.dayHistoryBtn}
          onPress={() => router.push('/day-history')}
          activeOpacity={0.85}
        >
          <Ionicons name="time-outline" size={18} color={colors.accent} />
          <Text style={styles.dayHistoryBtnText}>{t('profile.dayHistoryButton')}</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Yedekleme */}
        <View style={styles.backupSection}>
          <Text style={styles.sectionTitle}>{t('profile.backupSection')}</Text>
          <Text style={styles.sectionDesc}>
            {t('profile.backupSectionDesc')}
          </Text>
          <View style={styles.backupButtons}>
            <TouchableOpacity
              style={[styles.backupBtn, styles.exportBtn, backupLoading && styles.btnDisabled]}
              onPress={handleExport}
              disabled={backupLoading || restoreLoading}
              activeOpacity={0.85}
            >
              {backupLoading
                ? <ActivityIndicator color={colors.onAccent} size="small" />
                : <Text style={styles.backupBtnIcon}>📤</Text>
              }
              <Text style={styles.backupBtnText} numberOfLines={1}>
                {backupLoading ? t('profile.backupPreparing') : t('profile.backupButton')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.backupBtn, styles.importBtn, restoreLoading && styles.btnDisabled]}
              onPress={handleImport}
              disabled={backupLoading || restoreLoading}
              activeOpacity={0.85}
            >
              {restoreLoading
                ? <ActivityIndicator color={colors.onAccent} size="small" />
                : <Text style={styles.backupBtnIcon}>📥</Text>
              }
              <Text style={styles.backupBtnText} numberOfLines={1}>
                {restoreLoading ? t('profile.restoreLoading') : t('profile.restoreButton')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Geri Bildirim */}
        <View style={styles.backupSection}>
          <Text style={styles.sectionTitle}>{t('profile.feedbackSection')}</Text>
          <Text style={styles.sectionDesc}>{t('profile.feedbackSectionDesc')}</Text>
          <TouchableOpacity
            style={styles.feedbackBtn}
            onPress={() => setFeedbackVisible(true)}
            activeOpacity={0.85}
          >
            <Text style={styles.feedbackBtnIcon}>💬</Text>
            <Text style={styles.backupBtnText}>{t('profile.feedbackButton')}</Text>
          </TouchableOpacity>
        </View>

        <Modal
          visible={feedbackVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setFeedbackVisible(false)}
        >
          <KeyboardAvoidingView
            style={styles.feedbackOverlay}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
          <Pressable style={styles.feedbackOverlay} onPress={() => setFeedbackVisible(false)}>
            <Pressable style={styles.feedbackSheet} onPress={(e) => e.stopPropagation()}>
              <Text style={styles.feedbackSheetTitle}>{t('profile.feedbackSection')}</Text>
              <TextInput
                style={styles.feedbackInput}
                placeholder={t('profile.feedbackPlaceholder')}
                placeholderTextColor={colors.textMuted}
                value={feedbackText}
                onChangeText={setFeedbackText}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />
              <Button
                label={feedbackSending ? t('profile.feedbackSending') : t('profile.feedbackSubmit')}
                onPress={handleSendFeedback}
                loading={feedbackSending}
                disabled={!feedbackText.trim()}
              />
            </Pressable>
          </Pressable>
          </KeyboardAvoidingView>
        </Modal>

        {/* Dil Seçimi */}
        <View style={styles.languageSection}>
          <Text style={styles.sectionTitle}>{t('profile.language')}</Text>
          <LanguagePicker />
        </View>

        {/* Para Birimi Seçimi */}
        <View style={styles.languageSection}>
          <Text style={styles.sectionTitle}>{t('profile.currency')}</Text>
          <TouchableOpacity
            style={styles.languageTrigger}
            onPress={() => setCurrencyPickerVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.languageFlag}>{currentCurrency.symbol}</Text>
            <Text style={styles.languageTriggerText}>{currentCurrency.name}</Text>
            <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <BottomSheet
          visible={currencyPickerVisible}
          onClose={() => setCurrencyPickerVisible(false)}
          title={t('currency.title')}
        >
          <FlatList
            data={currencyOptions}
            keyExtractor={(item) => item.code}
            ItemSeparatorComponent={BottomSheetDivider}
            renderItem={({ item }) => {
              const isSelected = currency === item.code;
              return (
                <TouchableOpacity
                  style={styles.languageOptionRow}
                  onPress={() => {
                    setCurrency(item.code as SupportedCurrency);
                    setCurrencyPickerVisible(false);
                  }}
                  activeOpacity={0.75}
                >
                  <Text style={styles.languageFlag}>{item.symbol}</Text>
                  <Text style={[styles.languageOptionName, isSelected && styles.languageNameActive]}>
                    {item.name}
                  </Text>
                  {isSelected && <Ionicons name="checkmark-circle" size={20} color={colors.accent} />}
                </TouchableOpacity>
              );
            }}
          />
        </BottomSheet>

        {/* Tema Seçimi */}
        <View style={styles.languageSection}>
          <Text style={styles.sectionTitle}>{t('theme.title')}</Text>
          <View style={styles.themeSwitchRow}>
            {THEME_MODES.map((m) => {
              const isActive = themeMode === m.id;
              return (
                <TouchableOpacity
                  key={m.id}
                  style={[styles.themeSwitchOption, isActive && styles.themeSwitchOptionActive]}
                  onPress={() => setThemeMode(m.id)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[styles.themeSwitchText, isActive && styles.themeSwitchTextActive]}
                  >
                    {m.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Mesafe Birimi Seçimi */}
        <View style={styles.languageSection}>
          <Text style={styles.sectionTitle}>{t('distanceUnit.title')}</Text>
          <View style={styles.themeSwitchRow}>
            {DISTANCE_UNITS.map((u) => {
              const isActive = distanceUnit === u.id;
              return (
                <TouchableOpacity
                  key={u.id}
                  style={[styles.themeSwitchOption, isActive && styles.themeSwitchOptionActive]}
                  onPress={() => setDistanceUnit(u.id)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[styles.themeSwitchText, isActive && styles.themeSwitchTextActive]}
                  >
                    {u.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Çıkış */}
        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={() => signOut()}
          activeOpacity={0.85}
        >
          <Text style={styles.signOutText}>{t('profile.signOut')}</Text>
        </TouchableOpacity>

        {/* Hesap Silme */}
        <TouchableOpacity
          style={styles.deleteAccountBtn}
          onPress={() => router.push('/delete-account')}
          activeOpacity={0.85}
        >
          <Text style={styles.deleteAccountText}>{t('profile.deleteAccountLink')}</Text>
        </TouchableOpacity>

        {/* Uygulama Bilgisi */}
        <Card style={styles.appInfoCard}>
          <Text style={styles.appInfoTitle}>{t('profile.appInfoTitle')}</Text>
          <Text style={styles.appInfoVersion}>
            {t('profile.appInfoVersion', { version: Constants.expoConfig?.version ?? '1.1.0' })}
          </Text>
          <Text style={styles.appInfoDesc}>
            {t('profile.appInfoDesc')}
          </Text>
        </Card>
      </ScrollView>
      <View style={styles.bottomBannerWrap}>
        <AdBanner position="bottom" />
      </View>
    </SafeAreaView>
  );
}

const VEHICLE_TYPE_ICONS: Record<string, string> = {
  car: '🚗',
  motorcycle: '🏍️',
  truck: '🚚',
  van: '🚐',
};

function VehicleCard({
  vehicle,
  isActive,
  onPress,
  onSetActive,
}: {
  vehicle: Vehicle;
  isActive: boolean;
  onPress: () => void;
  onSetActive: () => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Card
        style={[
          styles.vehicleCard,
          isActive && styles.vehicleCardActive,
        ]}
      >
        <View style={styles.vehicleCardHeader}>
          <View style={styles.vehicleCardInfo}>
            <Text style={styles.vehicleName}>
              {VEHICLE_TYPE_ICONS[vehicle.type] ?? '🚗'} {vehicle.brand}{' '}
              {vehicle.model}
            </Text>
            <Text style={styles.vehicleMeta}>
              {vehicle.year ?? '—'} • {t(`fuelTypes.${vehicle.fuelType}`)}
            </Text>
            {vehicle.plate && (
              <View style={styles.plateBadge}>
                <Text style={styles.plateText}>{vehicle.plate}</Text>
              </View>
            )}
          </View>
          <View style={styles.vehicleCardActions}>
            {isActive ? (
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>✓ {t('vehicle.active')}</Text>
              </View>
            ) : (
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  onSetActive();
                }}
                style={styles.setActiveBtn}
              >
                <Text style={styles.setActiveBtnText}>{t('vehicle.setActiveButton')}</Text>
              </TouchableOpacity>
            )}
            <Text style={styles.chevron}>›</Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

function createStyles(colors: ColorTokens) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    scroll: { flex: 1 },
    content: { padding: 16, gap: 16, paddingBottom: 90 },
    bottomBannerWrap: { position: 'absolute', bottom: 0, left: 0, right: 0 },

    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    title: { color: colors.textPrimary, fontSize: 26, fontWeight: '800' },

    center: { alignItems: 'center', gap: 8, paddingVertical: 24 },
    loadingText: { color: colors.textSecondary, fontSize: 14 },

    errorBox: {
      backgroundColor: colors.surface,
      borderRadius: 10,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.danger,
    },
    errorText: { color: colors.danger, fontSize: 13 },

    emptyCard: { alignItems: 'center', gap: 10, paddingVertical: 24 },
    emptyTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: '700' },
    emptySubtitle: {
      color: colors.textSecondary,
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 20,
    },

    vehicleList: { gap: 10 },
    vehicleCard: { gap: 0 },
    vehicleCardActive: {
      borderWidth: 1.5,
      borderColor: colors.accent,
    },
    vehicleCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    vehicleCardInfo: { flex: 1, gap: 4 },
    vehicleName: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
    vehicleMeta: { color: colors.textSecondary, fontSize: 13 },
    plateBadge: {
      backgroundColor: colors.background,
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 3,
      alignSelf: 'flex-start',
      borderWidth: 1,
      borderColor: colors.border,
      marginTop: 4,
    },
    plateText: {
      color: colors.textPrimary,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 1,
    },
    vehicleCardActions: {
      alignItems: 'flex-end',
      gap: 6,
      marginLeft: 12,
    },
    activeBadge: {
      backgroundColor: colors.successSoftBg,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    activeBadgeText: { color: colors.successSoftText, fontSize: 12, fontWeight: '600' },
    setActiveBtn: {
      backgroundColor: colors.infoSoftBg,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderWidth: 1,
      borderColor: colors.accent,
    },
    setActiveBtnText: { color: colors.infoSoftText, fontSize: 12, fontWeight: '600' },
    chevron: { color: colors.textMuted, fontSize: 20 },

    backupSection: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 16,
      gap: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    dayHistoryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    dayHistoryBtnText: { flex: 1, color: colors.textPrimary, fontSize: 15, fontWeight: '600' },
    sectionTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
    sectionDesc: { color: colors.textSecondary, fontSize: 13, lineHeight: 19 },
    backupButtons: { flexDirection: 'row', gap: 10, marginTop: 4 },
    backupBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      borderRadius: 11,
      paddingVertical: 13,
    },
    exportBtn: { backgroundColor: colors.accent },
    importBtn: { backgroundColor: colors.accentSecondary },
    btnDisabled: { opacity: 0.55 },
    backupBtnIcon: { fontSize: 16 },
    backupBtnText: { color: colors.onAccent, fontWeight: '700', fontSize: 14 },

    feedbackBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      borderRadius: 11,
      paddingVertical: 13,
      backgroundColor: colors.accentSecondary,
    },
    feedbackBtnIcon: { fontSize: 16 },
    feedbackOverlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: 'flex-end',
    },
    feedbackSheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 16,
      paddingBottom: 32,
      gap: 12,
    },
    feedbackSheetTitle: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: '700',
      textAlign: 'center',
      marginBottom: 4,
    },
    feedbackInput: {
      backgroundColor: colors.background,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      color: colors.textPrimary,
      fontSize: 14,
      padding: 12,
      minHeight: 110,
      marginBottom: 4,
    },

    languageSection: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 16,
      gap: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    languageTrigger: {
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
    languageFlag: { fontSize: 20 },
    languageTriggerText: { flex: 1, color: colors.textPrimary, fontSize: 15, fontWeight: '600' },

    languageOptionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 14,
      paddingHorizontal: 4,
    },
    languageOptionName: { flex: 1, color: colors.textPrimary, fontSize: 15, fontWeight: '600' },
    languageNameActive: { color: colors.accent },

    themeSwitchRow: {
      flexDirection: 'row',
      backgroundColor: colors.background,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 4,
      gap: 4,
    },
    themeSwitchOption: {
      flex: 1,
      paddingVertical: 10,
      alignItems: 'center',
      borderRadius: 8,
    },
    themeSwitchOptionActive: { backgroundColor: colors.accent },
    themeSwitchText: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
    themeSwitchTextActive: { color: colors.onAccent },

    signOutBtn: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.danger,
    },
    signOutText: { color: colors.danger, fontWeight: '700', fontSize: 15 },
    deleteAccountBtn: {
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.dangerSoftBg,
      backgroundColor: colors.dangerSoftBg + '20',
    },
    deleteAccountText: { color: colors.dangerSoftText, fontWeight: '700', fontSize: 14 },
    appInfoCard: { alignItems: 'center', gap: 4, paddingVertical: 16, marginTop: 8 },
    appInfoTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '800' },
    appInfoVersion: { color: colors.accent, fontSize: 12 },
    appInfoDesc: {
      color: colors.textMuted,
      fontSize: 12,
      textAlign: 'center',
      lineHeight: 18,
      marginTop: 4,
    },
  });
}

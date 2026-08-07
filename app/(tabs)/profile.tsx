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
import { LANGUAGE_OPTIONS, changeLanguage, type SupportedLanguage } from '@/i18n';
import { useCurrencyStore, type SupportedCurrency } from '@stores/currencyStore';
import { useCurrencyOptions } from '@/i18n/options';
import { AdBanner } from '@components/AdBanner';
import { submitFeedback } from '@services/firestore';
import type { Vehicle } from '@/types';

export default function ProfileScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { vehicles, activeVehicle, isLoading, error, setActiveVehicle, fetchVehicles } =
    useVehicles();
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [languagePickerVisible, setLanguagePickerVisible] = useState(false);
  const [currencyPickerVisible, setCurrencyPickerVisible] = useState(false);
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSending, setFeedbackSending] = useState(false);
  const currentLanguage = LANGUAGE_OPTIONS.find((o) => o.code === i18n.language) ?? LANGUAGE_OPTIONS[0];
  const { currency, setCurrency } = useCurrencyStore();
  const currencyOptions = useCurrencyOptions();
  const currentCurrency = currencyOptions.find((o) => o.code === currency) ?? currencyOptions[0];

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
            <ActivityIndicator color="#3B82F6" />
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
                ? <ActivityIndicator color="#FFFFFF" size="small" />
                : <Text style={styles.backupBtnIcon}>📤</Text>
              }
              <Text style={styles.backupBtnText}>
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
                ? <ActivityIndicator color="#FFFFFF" size="small" />
                : <Text style={styles.backupBtnIcon}>📥</Text>
              }
              <Text style={styles.backupBtnText}>
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
            style={styles.overlay}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
          <Pressable style={styles.overlay} onPress={() => setFeedbackVisible(false)}>
            <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
              <Text style={styles.sheetTitle}>{t('profile.feedbackSection')}</Text>
              <TextInput
                style={styles.feedbackInput}
                placeholder={t('profile.feedbackPlaceholder')}
                placeholderTextColor="#64748B"
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
          <TouchableOpacity
            style={styles.languageTrigger}
            onPress={() => setLanguagePickerVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.languageFlag}>{currentLanguage.flag}</Text>
            <Text style={styles.languageTriggerText}>{currentLanguage.name}</Text>
            <Ionicons name="chevron-down" size={16} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        <Modal
          visible={languagePickerVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setLanguagePickerVisible(false)}
        >
          <Pressable style={styles.overlay} onPress={() => setLanguagePickerVisible(false)}>
            <View style={styles.sheet}>
              <Text style={styles.sheetTitle}>{t('language.title')}</Text>
              <FlatList
                data={LANGUAGE_OPTIONS}
                keyExtractor={(item) => item.code}
                ItemSeparatorComponent={() => <View style={styles.divider} />}
                renderItem={({ item }) => {
                  const isSelected = i18n.language === item.code;
                  return (
                    <TouchableOpacity
                      style={styles.languageOptionRow}
                      onPress={() => {
                        changeLanguage(item.code as SupportedLanguage);
                        setLanguagePickerVisible(false);
                      }}
                      activeOpacity={0.75}
                    >
                      <Text style={styles.languageFlag}>{item.flag}</Text>
                      <Text style={[styles.languageOptionName, isSelected && styles.languageNameActive]}>
                        {item.name}
                      </Text>
                      {isSelected && <Ionicons name="checkmark-circle" size={20} color="#3B82F6" />}
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          </Pressable>
        </Modal>

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
            <Ionicons name="chevron-down" size={16} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        <Modal
          visible={currencyPickerVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setCurrencyPickerVisible(false)}
        >
          <Pressable style={styles.overlay} onPress={() => setCurrencyPickerVisible(false)}>
            <View style={styles.sheet}>
              <Text style={styles.sheetTitle}>{t('currency.title')}</Text>
              <FlatList
                data={currencyOptions}
                keyExtractor={(item) => item.code}
                ItemSeparatorComponent={() => <View style={styles.divider} />}
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
                      {isSelected && <Ionicons name="checkmark-circle" size={20} color="#3B82F6" />}
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          </Pressable>
        </Modal>

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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0F172A' },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 16, paddingBottom: 90 },
  bottomBannerWrap: { position: 'absolute', bottom: 0, left: 0, right: 0 },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { color: '#F1F5F9', fontSize: 26, fontWeight: '800' },

  center: { alignItems: 'center', gap: 8, paddingVertical: 24 },
  loadingText: { color: '#94A3B8', fontSize: 14 },

  errorBox: {
    backgroundColor: '#1C1917',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  errorText: { color: '#EF4444', fontSize: 13 },

  emptyCard: { alignItems: 'center', gap: 10, paddingVertical: 24 },
  emptyTitle: { color: '#F1F5F9', fontSize: 17, fontWeight: '700' },
  emptySubtitle: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },

  vehicleList: { gap: 10 },
  vehicleCard: { gap: 0 },
  vehicleCardActive: {
    borderWidth: 1.5,
    borderColor: '#3B82F6',
  },
  vehicleCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vehicleCardInfo: { flex: 1, gap: 4 },
  vehicleName: { color: '#F1F5F9', fontSize: 16, fontWeight: '700' },
  vehicleMeta: { color: '#94A3B8', fontSize: 13 },
  plateBadge: {
    backgroundColor: '#0F172A',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#334155',
    marginTop: 4,
  },
  plateText: {
    color: '#F1F5F9',
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
    backgroundColor: '#15803D',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  activeBadgeText: { color: '#DCFCE7', fontSize: 12, fontWeight: '600' },
  setActiveBtn: {
    backgroundColor: '#1E3A5F',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  setActiveBtnText: { color: '#93C5FD', fontSize: 12, fontWeight: '600' },
  chevron: { color: '#64748B', fontSize: 20 },

  backupSection: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sectionTitle: { color: '#F1F5F9', fontSize: 16, fontWeight: '700' },
  sectionDesc: { color: '#94A3B8', fontSize: 13, lineHeight: 19 },
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
  exportBtn: { backgroundColor: '#3B82F6' },
  importBtn: { backgroundColor: '#6366F1' },
  btnDisabled: { opacity: 0.55 },
  backupBtnIcon: { fontSize: 16 },
  backupBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },

  feedbackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 11,
    paddingVertical: 13,
    backgroundColor: '#6366F1',
  },
  feedbackBtnIcon: { fontSize: 16 },
  feedbackInput: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    color: '#F1F5F9',
    fontSize: 14,
    padding: 12,
    minHeight: 110,
    marginBottom: 4,
  },

  languageSection: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  languageTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#0F172A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  languageFlag: { fontSize: 20 },
  languageTriggerText: { flex: 1, color: '#F1F5F9', fontSize: 15, fontWeight: '600' },

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
  languageOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  languageOptionName: { flex: 1, color: '#CBD5E1', fontSize: 15, fontWeight: '600' },
  languageNameActive: { color: '#3B82F6' },

  signOutBtn: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  signOutText: { color: '#EF4444', fontWeight: '700', fontSize: 15 },
  deleteAccountBtn: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#7F1D1D',
    backgroundColor: '#7F1D1D20',
  },
  deleteAccountText: { color: '#F87171', fontWeight: '700', fontSize: 14 },
  appInfoCard: { alignItems: 'center', gap: 4, paddingVertical: 16, marginTop: 8 },
  appInfoTitle: { color: '#F1F5F9', fontSize: 16, fontWeight: '800' },
  appInfoVersion: { color: '#3B82F6', fontSize: 12 },
  appInfoDesc: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 4,
  },
});

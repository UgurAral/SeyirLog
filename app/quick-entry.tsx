import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTripStore } from '@stores/tripStore';
import { useFuelStore } from '@stores/fuelStore';
import { useExpenseStore } from '@stores/expenseStore';
import { useIncomeStore } from '@stores/incomeStore';
import { useVehicles } from '@hooks/useVehicles';
import { formatCurrency } from '@utils/formatters';
import { useCurrencyStore, CURRENCY_SYMBOLS } from '@stores/currencyStore';
import { AdBanner } from '@components/AdBanner';
import { useExpenseCategoryOptions } from '@/i18n/options';
import type { ExpenseCategory } from '@/types';

type Tab = 'trip' | 'fuel' | 'expense' | 'income';

export default function QuickEntryModal() {
  const router = useRouter();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>('trip');
  const { activeVehicle } = useVehicles();
  const { activeTrip, addTrip, completeTrip } = useTripStore();
  const { addFuelEntry } = useFuelStore();
  const { addExpense } = useExpenseStore();
  const { addEntry: addIncomeEntry } = useIncomeStore();
  const categoryOptions = useExpenseCategoryOptions();
  const activeCurrency = useCurrencyStore((s) => s.currency);

  const TABS: { id: Tab; label: string; icon: string; color: string }[] = [
    { id: 'trip', label: t('quickEntry.tabTrip'), icon: '🚖', color: '#22C55E' },
    { id: 'fuel', label: t('quickEntry.tabFuel'), icon: '⛽', color: '#F59E0B' },
    { id: 'expense', label: t('quickEntry.tabExpense'), icon: '💸', color: '#EF4444' },
    { id: 'income', label: t('quickEntry.tabIncome'), icon: '💰', color: '#3B82F6' },
  ];

  const vehicleId = activeVehicle?.id;

  // ── Sefer formu ──────────────────────────────────────────────────────────────
  const [tripForm, setTripForm] = useState({ origin: 'A', destination: 'B' });
  const [endForm, setEndForm] = useState({ distanceKm: '', earnings: '' });
  const [tripSaving, setTripSaving] = useState(false);

  const handleStartTrip = useCallback(async () => {
    const origin = tripForm.origin.trim() || 'A';
    const destination = tripForm.destination.trim() || 'B';
    setTripSaving(true);
    try {
      const now = Math.floor(Date.now() / 1000);
      await addTrip({
        vehicleId,
        origin,
        destination,
        startTime: now,
        status: 'active',
        createdAt: now,
        updatedAt: now,
      });
      setTripForm({ origin: 'A', destination: 'B' });
      Alert.alert(t('quickEntry.tripStartedTitle'), `${origin} → ${destination}`, [
        { text: t('common.ok'), onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert(t('common.error'), String(e));
    } finally {
      setTripSaving(false);
    }
  }, [tripForm, vehicleId, addTrip, router, t]);

  const handleEndTrip = useCallback(async () => {
    if (!activeTrip) return;
    const distanceKm = parseFloat(endForm.distanceKm);
    const earnings = parseFloat(endForm.earnings) || 0;
    if (isNaN(distanceKm) || distanceKm <= 0) {
      Alert.alert(t('quickEntry.invalidDistanceTitle'), t('quickEntry.invalidDistanceBody'));
      return;
    }
    setTripSaving(true);
    try {
      const now = Math.floor(Date.now() / 1000);
      await completeTrip(activeTrip.id, distanceKm, now, earnings);
      setEndForm({ distanceKm: '', earnings: '' });
      const perKm = distanceKm > 0 ? earnings / distanceKm : 0;
      Alert.alert(
        t('quickEntry.tripCompletedTitle'),
        `${distanceKm.toFixed(0)} km · ${formatCurrency(earnings, activeCurrency)}\n${t('quickEntry.perKmLabel')}: ${formatCurrency(perKm, activeCurrency)}/km`,
        [{ text: t('common.ok'), onPress: () => router.back() }],
      );
    } catch (e) {
      Alert.alert(t('common.error'), String(e));
    } finally {
      setTripSaving(false);
    }
  }, [activeTrip, endForm, completeTrip, router, t, activeCurrency]);

  // ── Yakıt formu ──────────────────────────────────────────────────────────────
  const [fuelForm, setFuelForm] = useState({ liters: '', pricePerLiter: '', currentKm: '' });
  const [fuelSaving, setFuelSaving] = useState(false);
  const fuelTotal = (parseFloat(fuelForm.liters) || 0) * (parseFloat(fuelForm.pricePerLiter) || 0);

  const handleAddFuel = useCallback(async () => {
    const liters = parseFloat(fuelForm.liters);
    const price = parseFloat(fuelForm.pricePerLiter);
    if (isNaN(liters) || liters <= 0 || isNaN(price) || price <= 0) {
      Alert.alert(t('quickEntry.missingTitle'), t('quickEntry.missingFuelBody'));
      return;
    }
    setFuelSaving(true);
    try {
      const now = Math.floor(Date.now() / 1000);
      await addFuelEntry({
        vehicleId,
        liters,
        pricePerLiter: price,
        totalCost: fuelTotal,
        currentKm: fuelForm.currentKm ? parseFloat(fuelForm.currentKm) : undefined,
        date: now,
        createdAt: now,
        updatedAt: now,
      });
      setFuelForm({ liters: '', pricePerLiter: '', currentKm: '' });
      Alert.alert(t('quickEntry.fuelAddedTitle'), `${liters}L · ${formatCurrency(fuelTotal, activeCurrency)}`, [
        { text: t('common.ok'), onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert(t('common.error'), String(e));
    } finally {
      setFuelSaving(false);
    }
  }, [fuelForm, fuelTotal, vehicleId, addFuelEntry, router, t]);

  // ── Gider formu ──────────────────────────────────────────────────────────────
  const [expenseForm, setExpenseForm] = useState<{ category: ExpenseCategory; amount: string; description: string }>({
    category: 'other',
    amount: '',
    description: '',
  });
  const [expenseSaving, setExpenseSaving] = useState(false);

  const handleAddExpense = useCallback(async () => {
    const amount = parseFloat(expenseForm.amount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert(t('quickEntry.missingTitle'), t('quickEntry.missingAmountBody'));
      return;
    }
    setExpenseSaving(true);
    try {
      const now = Math.floor(Date.now() / 1000);
      await addExpense({
        vehicleId,
        category: expenseForm.category,
        amount,
        description: expenseForm.description.trim() || undefined,
        date: now,
        createdAt: now,
        updatedAt: now,
      });
      setExpenseForm({ category: 'other', amount: '', description: '' });
      Alert.alert(t('quickEntry.expenseAddedTitle'), formatCurrency(amount, activeCurrency), [
        { text: t('common.ok'), onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert(t('common.error'), String(e));
    } finally {
      setExpenseSaving(false);
    }
  }, [expenseForm, vehicleId, addExpense, router, t]);

  // ── Gelir formu ──────────────────────────────────────────────────────────────
  const [incomeForm, setIncomeForm] = useState({ amount: '', source: '', description: '' });
  const [incomeSaving, setIncomeSaving] = useState(false);

  const handleAddIncome = useCallback(async () => {
    const amount = parseFloat(incomeForm.amount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert(t('quickEntry.missingTitle'), t('quickEntry.missingAmountBody'));
      return;
    }
    setIncomeSaving(true);
    try {
      const now = Math.floor(Date.now() / 1000);
      await addIncomeEntry({
        vehicleId,
        amount,
        source: (incomeForm.source.trim() || undefined) as 'trip' | 'bonus' | 'other' | undefined,
        description: incomeForm.description.trim() || undefined,
        date: now,
      });
      setIncomeForm({ amount: '', source: '', description: '' });
      Alert.alert(t('quickEntry.incomeAddedTitle'), formatCurrency(amount, activeCurrency), [
        { text: t('common.ok'), onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert(t('common.error'), String(e));
    } finally {
      setIncomeSaving(false);
    }
  }, [incomeForm, vehicleId, addIncomeEntry, router, t]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Üst banner */}
        <AdBanner position="top" />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('quickEntry.title')}</Text>
          <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="close-circle" size={28} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabBar}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && { borderBottomColor: tab.color, borderBottomWidth: 2.5 }]}
              onPress={() => setActiveTab(tab.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.tabIcon}>{tab.icon}</Text>
              <Text style={[styles.tabLabel, activeTab === tab.id && { color: tab.color }]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── SEFER TAB ── */}
          {activeTab === 'trip' && (
            <View style={styles.form}>
              {activeTrip ? (
                /* Aktif sefer var → bitirme formu */
                <>
                  <View style={styles.activeTripBanner}>
                    <View style={styles.activeDot} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.activeTripLabel}>{t('quickEntry.activeTripLabel')}</Text>
                      <Text style={styles.activeTripRoute}>
                        {activeTrip.origin} → {activeTrip.destination}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.sectionLabel}>{t('quickEntry.endTripSection')}</Text>
                  <QInput
                    label={t('quickEntry.distanceLabel')}
                    placeholder={t('quickEntry.distancePlaceholder')}
                    value={endForm.distanceKm}
                    onChangeText={(v) => setEndForm((f) => ({ ...f, distanceKm: v }))}
                    keyboardType="numeric"
                  />
                  <QInput
                    label={t('quickEntry.earningsLabel')}
                    placeholder="0.00"
                    value={endForm.earnings}
                    onChangeText={(v) => setEndForm((f) => ({ ...f, earnings: v }))}
                    keyboardType="numeric"
                  />
                  <SaveButton
                    label={t('quickEntry.endTripButton')}
                    color="#22C55E"
                    loading={tripSaving}
                    onPress={handleEndTrip}
                  />
                </>
              ) : (
                /* Aktif sefer yok → başlatma formu */
                <>
                  <Text style={styles.sectionLabel}>{t('quickEntry.startTripSection')}</Text>
                  <SaveButton
                    label={t('quickEntry.startTripButton')}
                    color="#22C55E"
                    loading={tripSaving}
                    onPress={handleStartTrip}
                  />
                  <QInput
                    label={t('quickEntry.departureLabel')}
                    placeholder={t('quickEntry.departurePlaceholder')}
                    value={tripForm.origin}
                    onChangeText={(v) => setTripForm((f) => ({ ...f, origin: v }))}
                    autoCapitalize="sentences"
                  />
                  <QInput
                    label={t('quickEntry.arrivalLabel')}
                    placeholder={t('quickEntry.arrivalPlaceholder')}
                    value={tripForm.destination}
                    onChangeText={(v) => setTripForm((f) => ({ ...f, destination: v }))}
                    autoCapitalize="sentences"
                  />
                </>
              )}
            </View>
          )}

          {/* ── YAKIT TAB ── */}
          {activeTab === 'fuel' && (
            <View style={styles.form}>
              <Text style={styles.sectionLabel}>{t('quickEntry.fuelSection')}</Text>
              <QInput
                label={t('quickEntry.litersLabel')}
                placeholder={t('quickEntry.litersPlaceholder')}
                value={fuelForm.liters}
                onChangeText={(v) => setFuelForm((f) => ({ ...f, liters: v }))}
                keyboardType="decimal-pad"
              />
              <QInput
                label={t('quickEntry.priceLabel')}
                placeholder={t('quickEntry.pricePlaceholder')}
                value={fuelForm.pricePerLiter}
                onChangeText={(v) => setFuelForm((f) => ({ ...f, pricePerLiter: v }))}
                keyboardType="decimal-pad"
              />
              {fuelTotal > 0 && (
                <View style={styles.calcBadge}>
                  <Text style={styles.calcBadgeText}>
                    {t('quickEntry.totalLabel')}: {formatCurrency(fuelTotal, activeCurrency)}
                  </Text>
                </View>
              )}
              <QInput
                label={t('quickEntry.currentKmLabel')}
                placeholder={t('quickEntry.currentKmPlaceholder')}
                value={fuelForm.currentKm}
                onChangeText={(v) => setFuelForm((f) => ({ ...f, currentKm: v }))}
                keyboardType="numeric"
              />
              <SaveButton
                label={t('quickEntry.addFuelButton')}
                color="#F59E0B"
                loading={fuelSaving}
                onPress={handleAddFuel}
              />
            </View>
          )}

          {/* ── GİDER TAB ── */}
          {activeTab === 'expense' && (
            <View style={styles.form}>
              <Text style={styles.sectionLabel}>{t('quickEntry.expenseSection')}</Text>
              <Text style={styles.fieldLabel}>{t('quickEntry.categoryLabel')}</Text>
              <View style={styles.categoryGrid}>
                {categoryOptions.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.categoryChip,
                      expenseForm.category === opt.value && styles.categoryChipActive,
                    ]}
                    onPress={() =>
                      setExpenseForm((f) => ({ ...f, category: opt.value as ExpenseCategory }))
                    }
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        expenseForm.category === opt.value && styles.categoryChipTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <QInput
                label={t('quickEntry.amountLabelTL')}
                placeholder={t('quickEntry.amountPlaceholder')}
                value={expenseForm.amount}
                onChangeText={(v) => setExpenseForm((f) => ({ ...f, amount: v }))}
                keyboardType="decimal-pad"
              />
              <QInput
                label={t('quickEntry.descriptionLabel')}
                placeholder={t('quickEntry.descriptionPlaceholder')}
                value={expenseForm.description}
                onChangeText={(v) => setExpenseForm((f) => ({ ...f, description: v }))}
              />
              <SaveButton
                label={t('quickEntry.addExpenseButton')}
                color="#EF4444"
                loading={expenseSaving}
                onPress={handleAddExpense}
              />
            </View>
          )}

          {/* ── GELİR TAB ── */}
          {activeTab === 'income' && (
            <View style={styles.form}>
              <Text style={styles.sectionLabel}>{t('quickEntry.incomeSection')}</Text>
              <QInput
                label={t('quickEntry.amountLabelTL')}
                placeholder={t('quickEntry.amountPlaceholder')}
                value={incomeForm.amount}
                onChangeText={(v) => setIncomeForm((f) => ({ ...f, amount: v }))}
                keyboardType="decimal-pad"
              />
              <QInput
                label={t('quickEntry.sourceLabel')}
                placeholder={t('quickEntry.sourcePlaceholder')}
                value={incomeForm.source}
                onChangeText={(v) => setIncomeForm((f) => ({ ...f, source: v }))}
              />
              <QInput
                label={t('quickEntry.noteLabel')}
                placeholder={t('quickEntry.notePlaceholder')}
                value={incomeForm.description}
                onChangeText={(v) => setIncomeForm((f) => ({ ...f, description: v }))}
              />
              <SaveButton
                label={t('quickEntry.addIncomeButton')}
                color="#3B82F6"
                loading={incomeSaving}
                onPress={handleAddIncome}
              />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function QInput({
  label,
  placeholder,
  value,
  onChangeText,
  keyboardType = 'default',
  autoCapitalize = 'none',
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: 'default' | 'numeric' | 'decimal-pad';
  autoCapitalize?: 'none' | 'sentences';
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#475569"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
      />
    </View>
  );
}

function SaveButton({
  label,
  color,
  loading,
  onPress,
}: {
  label: string;
  color: string;
  loading: boolean;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  return (
    <TouchableOpacity
      style={[styles.saveBtn, { backgroundColor: color }, loading && { opacity: 0.6 }]}
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.85}
    >
      <Text style={styles.saveBtnText}>{loading ? t('common.saving') : label}</Text>
    </TouchableOpacity>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0F172A' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  headerTitle: { color: '#F1F5F9', fontSize: 18, fontWeight: '700' },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    gap: 2,
    borderBottomWidth: 2.5,
    borderBottomColor: 'transparent',
  },
  tabIcon: { fontSize: 18 },
  tabLabel: { color: '#64748B', fontSize: 11, fontWeight: '600' },

  body: { flex: 1 },
  bodyContent: { padding: 20, gap: 0 },

  form: { gap: 12 },

  sectionLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },

  activeTripBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#22C55E15',
    borderRadius: 12,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: '#22C55E30',
    marginBottom: 8,
  },
  activeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22C55E',
    marginTop: 4,
  },
  activeTripLabel: { color: '#22C55E', fontSize: 11, fontWeight: '600' },
  activeTripRoute: { color: '#F1F5F9', fontSize: 15, fontWeight: '700', marginTop: 2 },
  activeTripKm: { color: '#64748B', fontSize: 12, marginTop: 2 },

  inputGroup: { gap: 6 },
  fieldLabel: { color: '#94A3B8', fontSize: 13, fontWeight: '500' },
  input: {
    backgroundColor: '#1E293B',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#F1F5F9',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#334155',
  },

  calcHint: {
    color: '#22C55E',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
    marginTop: -4,
  },
  calcBadge: {
    backgroundColor: '#F59E0B20',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#F59E0B40',
  },
  calcBadgeText: { color: '#F59E0B', fontWeight: '700', fontSize: 14 },

  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  categoryChipActive: {
    backgroundColor: '#EF444420',
    borderColor: '#EF4444',
  },
  categoryChipText: { color: '#94A3B8', fontSize: 12, fontWeight: '500' },
  categoryChipTextActive: { color: '#EF4444', fontWeight: '700' },

  saveBtn: {
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
});

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
import { useTripStore } from '@stores/tripStore';
import { useFuelStore } from '@stores/fuelStore';
import { useExpenseStore } from '@stores/expenseStore';
import { useIncomeStore } from '@stores/incomeStore';
import { useVehicles } from '@hooks/useVehicles';
import { formatCurrency } from '@utils/formatters';
import { EXPENSE_CATEGORY_OPTIONS } from '@/types';
import type { ExpenseCategory } from '@/types';

type Tab = 'trip' | 'fuel' | 'expense' | 'income';

const TABS: { id: Tab; label: string; icon: string; color: string }[] = [
  { id: 'trip', label: 'Sefer', icon: '🚖', color: '#22C55E' },
  { id: 'fuel', label: 'Yakıt', icon: '⛽', color: '#F59E0B' },
  { id: 'expense', label: 'Gider', icon: '💸', color: '#EF4444' },
  { id: 'income', label: 'Gelir', icon: '💰', color: '#3B82F6' },
];

export default function QuickEntryModal() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('trip');
  const { activeVehicle } = useVehicles();
  const { activeTrip, addTrip, completeTrip } = useTripStore();
  const { addFuelEntry } = useFuelStore();
  const { addExpense } = useExpenseStore();
  const { addEntry: addIncomeEntry } = useIncomeStore();

  const vehicleId = activeVehicle?.id;

  // ── Sefer formu ──────────────────────────────────────────────────────────────
  const [tripForm, setTripForm] = useState({ origin: '', destination: '', startKm: '' });
  const [endForm, setEndForm] = useState({ endKm: '', earnings: '' });
  const [tripSaving, setTripSaving] = useState(false);

  const handleStartTrip = useCallback(async () => {
    if (!tripForm.origin.trim() || !tripForm.destination.trim()) {
      Alert.alert('Eksik', 'Kalkış ve varış zorunlu.');
      return;
    }
    const startKm = parseFloat(tripForm.startKm);
    if (isNaN(startKm) || startKm < 0) {
      Alert.alert('Geçersiz KM', 'Başlangıç km giriniz.');
      return;
    }
    setTripSaving(true);
    try {
      const now = Math.floor(Date.now() / 1000);
      await addTrip({
        vehicleId,
        origin: tripForm.origin.trim(),
        destination: tripForm.destination.trim(),
        startKm,
        startTime: now,
        status: 'active',
        createdAt: now,
        updatedAt: now,
      });
      setTripForm({ origin: '', destination: '', startKm: '' });
      Alert.alert('✅ Sefer Başladı', `${tripForm.origin} → ${tripForm.destination}`, [
        { text: 'Tamam', onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert('Hata', String(e));
    } finally {
      setTripSaving(false);
    }
  }, [tripForm, vehicleId, addTrip, router]);

  const handleEndTrip = useCallback(async () => {
    if (!activeTrip) return;
    const endKm = parseFloat(endForm.endKm);
    const earnings = parseFloat(endForm.earnings) || 0;
    if (isNaN(endKm) || endKm < activeTrip.startKm) {
      Alert.alert('Geçersiz KM', `Bitiş km ${activeTrip.startKm}'den büyük olmalı.`);
      return;
    }
    setTripSaving(true);
    try {
      const now = Math.floor(Date.now() / 1000);
      await completeTrip(activeTrip.id, endKm, now, earnings);
      setEndForm({ endKm: '', earnings: '' });
      const dist = endKm - activeTrip.startKm;
      Alert.alert(
        '✅ Sefer Tamamlandı',
        `${dist.toFixed(0)} km · ${formatCurrency(earnings)}`,
        [{ text: 'Tamam', onPress: () => router.back() }],
      );
    } catch (e) {
      Alert.alert('Hata', String(e));
    } finally {
      setTripSaving(false);
    }
  }, [activeTrip, endForm, completeTrip, router]);

  // ── Yakıt formu ──────────────────────────────────────────────────────────────
  const [fuelForm, setFuelForm] = useState({ liters: '', pricePerLiter: '', currentKm: '' });
  const [fuelSaving, setFuelSaving] = useState(false);
  const fuelTotal = (parseFloat(fuelForm.liters) || 0) * (parseFloat(fuelForm.pricePerLiter) || 0);

  const handleAddFuel = useCallback(async () => {
    const liters = parseFloat(fuelForm.liters);
    const price = parseFloat(fuelForm.pricePerLiter);
    if (isNaN(liters) || liters <= 0 || isNaN(price) || price <= 0) {
      Alert.alert('Eksik', 'Litre ve fiyat zorunlu.');
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
      Alert.alert('✅ Yakıt Eklendi', `${liters}L · ${formatCurrency(fuelTotal)}`, [
        { text: 'Tamam', onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert('Hata', String(e));
    } finally {
      setFuelSaving(false);
    }
  }, [fuelForm, fuelTotal, vehicleId, addFuelEntry, router]);

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
      Alert.alert('Eksik', 'Tutar giriniz.');
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
      Alert.alert('✅ Gider Eklendi', formatCurrency(amount), [
        { text: 'Tamam', onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert('Hata', String(e));
    } finally {
      setExpenseSaving(false);
    }
  }, [expenseForm, vehicleId, addExpense, router]);

  // ── Gelir formu ──────────────────────────────────────────────────────────────
  const [incomeForm, setIncomeForm] = useState({ amount: '', source: '', description: '' });
  const [incomeSaving, setIncomeSaving] = useState(false);

  const handleAddIncome = useCallback(async () => {
    const amount = parseFloat(incomeForm.amount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Eksik', 'Tutar giriniz.');
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
      Alert.alert('✅ Gelir Eklendi', formatCurrency(amount), [
        { text: 'Tamam', onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert('Hata', String(e));
    } finally {
      setIncomeSaving(false);
    }
  }, [incomeForm, vehicleId, addIncomeEntry, router]);

  const activeTabData = TABS.find((t) => t.id === activeTab)!;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Hızlı Giriş</Text>
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
                      <Text style={styles.activeTripLabel}>Aktif Sefer</Text>
                      <Text style={styles.activeTripRoute}>
                        {activeTrip.origin} → {activeTrip.destination}
                      </Text>
                      <Text style={styles.activeTripKm}>
                        Başlangıç: {activeTrip.startKm} km
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.sectionLabel}>Seferi Bitir</Text>
                  <QInput
                    label="Bitiş KM *"
                    placeholder={`${activeTrip.startKm}+'den büyük`}
                    value={endForm.endKm}
                    onChangeText={(v) => setEndForm((f) => ({ ...f, endKm: v }))}
                    keyboardType="numeric"
                  />
                  {endForm.endKm && parseFloat(endForm.endKm) > activeTrip.startKm && (
                    <Text style={styles.calcHint}>
                      📏 {(parseFloat(endForm.endKm) - activeTrip.startKm).toFixed(0)} km
                    </Text>
                  )}
                  <QInput
                    label="Kazanç (₺)"
                    placeholder="0.00"
                    value={endForm.earnings}
                    onChangeText={(v) => setEndForm((f) => ({ ...f, earnings: v }))}
                    keyboardType="numeric"
                  />
                  <SaveButton
                    label="Seferi Bitir"
                    color="#22C55E"
                    loading={tripSaving}
                    onPress={handleEndTrip}
                  />
                </>
              ) : (
                /* Aktif sefer yok → başlatma formu */
                <>
                  <Text style={styles.sectionLabel}>Sefer Başlat</Text>
                  <QInput
                    label="Kalkış *"
                    placeholder="Nereden?"
                    value={tripForm.origin}
                    onChangeText={(v) => setTripForm((f) => ({ ...f, origin: v }))}
                    autoCapitalize="sentences"
                  />
                  <QInput
                    label="Varış *"
                    placeholder="Nereye?"
                    value={tripForm.destination}
                    onChangeText={(v) => setTripForm((f) => ({ ...f, destination: v }))}
                    autoCapitalize="sentences"
                  />
                  <QInput
                    label="Başlangıç KM *"
                    placeholder="Sayaç değeri"
                    value={tripForm.startKm}
                    onChangeText={(v) => setTripForm((f) => ({ ...f, startKm: v }))}
                    keyboardType="numeric"
                  />
                  <SaveButton
                    label="Seferi Başlat"
                    color="#22C55E"
                    loading={tripSaving}
                    onPress={handleStartTrip}
                  />
                </>
              )}
            </View>
          )}

          {/* ── YAKIT TAB ── */}
          {activeTab === 'fuel' && (
            <View style={styles.form}>
              <Text style={styles.sectionLabel}>Yakıt Girişi</Text>
              <QInput
                label="Litre *"
                placeholder="Kaç litre?"
                value={fuelForm.liters}
                onChangeText={(v) => setFuelForm((f) => ({ ...f, liters: v }))}
                keyboardType="decimal-pad"
              />
              <QInput
                label="Litre Fiyatı (₺) *"
                placeholder="Litre başı fiyat"
                value={fuelForm.pricePerLiter}
                onChangeText={(v) => setFuelForm((f) => ({ ...f, pricePerLiter: v }))}
                keyboardType="decimal-pad"
              />
              {fuelTotal > 0 && (
                <View style={styles.calcBadge}>
                  <Text style={styles.calcBadgeText}>
                    Toplam: {formatCurrency(fuelTotal)}
                  </Text>
                </View>
              )}
              <QInput
                label="Güncel KM"
                placeholder="İsteğe bağlı"
                value={fuelForm.currentKm}
                onChangeText={(v) => setFuelForm((f) => ({ ...f, currentKm: v }))}
                keyboardType="numeric"
              />
              <SaveButton
                label="Yakıt Ekle"
                color="#F59E0B"
                loading={fuelSaving}
                onPress={handleAddFuel}
              />
            </View>
          )}

          {/* ── GİDER TAB ── */}
          {activeTab === 'expense' && (
            <View style={styles.form}>
              <Text style={styles.sectionLabel}>Gider Ekle</Text>
              <Text style={styles.fieldLabel}>Kategori</Text>
              <View style={styles.categoryGrid}>
                {EXPENSE_CATEGORY_OPTIONS.map((opt) => (
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
                label="Tutar (₺) *"
                placeholder="Ne kadar?"
                value={expenseForm.amount}
                onChangeText={(v) => setExpenseForm((f) => ({ ...f, amount: v }))}
                keyboardType="decimal-pad"
              />
              <QInput
                label="Açıklama"
                placeholder="İsteğe bağlı"
                value={expenseForm.description}
                onChangeText={(v) => setExpenseForm((f) => ({ ...f, description: v }))}
              />
              <SaveButton
                label="Gider Ekle"
                color="#EF4444"
                loading={expenseSaving}
                onPress={handleAddExpense}
              />
            </View>
          )}

          {/* ── GELİR TAB ── */}
          {activeTab === 'income' && (
            <View style={styles.form}>
              <Text style={styles.sectionLabel}>Gelir Ekle</Text>
              <QInput
                label="Tutar (₺) *"
                placeholder="Ne kadar?"
                value={incomeForm.amount}
                onChangeText={(v) => setIncomeForm((f) => ({ ...f, amount: v }))}
                keyboardType="decimal-pad"
              />
              <QInput
                label="Kaynak"
                placeholder="Sefer, bonus, vb."
                value={incomeForm.source}
                onChangeText={(v) => setIncomeForm((f) => ({ ...f, source: v }))}
              />
              <QInput
                label="Not"
                placeholder="İsteğe bağlı"
                value={incomeForm.description}
                onChangeText={(v) => setIncomeForm((f) => ({ ...f, description: v }))}
              />
              <SaveButton
                label="Gelir Ekle"
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
  return (
    <TouchableOpacity
      style={[styles.saveBtn, { backgroundColor: color }, loading && { opacity: 0.6 }]}
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.85}
    >
      <Text style={styles.saveBtnText}>{loading ? 'Kaydediliyor…' : label}</Text>
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

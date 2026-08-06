import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  FlatList,
  type TextStyle,
  type StyleProp,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '@utils/formatters';
import { SUPPORTED_CURRENCIES, type SupportedCurrency } from '@stores/currencyStore';

interface CurrencyBreakdownValueProps {
  /** Para birimi koduna göre toplamlar, örn. { TRY: 100, USD: 20 } */
  amounts: Record<string, number>;
  /** Kutunun varsayılan olarak gösterdiği (uygulama genelinde seçili) para birimi */
  activeCurrency: SupportedCurrency;
  /** Sabit renk. `colorFor` verilirse o öncelikli olur. */
  color?: string;
  /** Gösterilen tutara göre dinamik renk (örn. net kazanç işaretine göre) */
  colorFor?: (amount: number) => string;
  textStyle?: StyleProp<TextStyle>;
}

/**
 * Bir toplam kutusunda aktif para biriminin tutarını gösterir; kutuda
 * başka para biriminde de işlem varsa küçük bir dropdown ile o para
 * biriminin toplamı da "gözat" amaçlı görülebilir — seçim sadece bu
 * kutunun görünümünü değiştirir, uygulama genelindeki para birimini
 * değiştirmez (o sadece Profil ekranından değişir).
 */
export function CurrencyBreakdownValue({
  amounts,
  activeCurrency,
  color,
  colorFor,
  textStyle,
}: CurrencyBreakdownValueProps) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<SupportedCurrency>(activeCurrency);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setSelected(activeCurrency);
  }, [activeCurrency]);

  const amount = amounts[selected] ?? 0;
  const resolvedColor = colorFor ? colorFor(amount) : color;
  const hasOtherCurrencies = SUPPORTED_CURRENCIES.some(
    (c) => c !== activeCurrency && (amounts[c] ?? 0) !== 0,
  );

  return (
    <View>
      <TouchableOpacity
        onPress={() => hasOtherCurrencies && setVisible(true)}
        activeOpacity={hasOtherCurrencies ? 0.7 : 1}
        disabled={!hasOtherCurrencies}
        style={styles.row}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      >
        <Text style={[textStyle, resolvedColor ? { color: resolvedColor } : null]}>
          {formatCurrency(amount, selected)}
        </Text>
        {hasOtherCurrencies && (
          <Ionicons name="chevron-down" size={11} color="#64748B" style={styles.chevron} />
        )}
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{t('currency.otherCurrencies')}</Text>
            <FlatList
              data={SUPPORTED_CURRENCIES}
              keyExtractor={(item) => item}
              ItemSeparatorComponent={() => <View style={styles.divider} />}
              renderItem={({ item }) => {
                const isSelected = selected === item;
                return (
                  <TouchableOpacity
                    style={styles.optionRow}
                    onPress={() => {
                      setSelected(item);
                      setVisible(false);
                    }}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.optionCode, isSelected && styles.optionActive]}>{item}</Text>
                    <Text style={[styles.optionValue, isSelected && styles.optionActive]}>
                      {formatCurrency(amounts[item] ?? 0, item)}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  chevron: { marginTop: 1 },
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
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  optionCode: { color: '#94A3B8', fontSize: 14, fontWeight: '700' },
  optionValue: { color: '#CBD5E1', fontSize: 15, fontWeight: '600' },
  optionActive: { color: '#3B82F6' },
});

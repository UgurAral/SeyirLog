import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  type TextStyle,
  type StyleProp,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '@utils/formatters';
import { SUPPORTED_CURRENCIES, type SupportedCurrency } from '@stores/currencyStore';
import { BottomSheet, BottomSheetDivider } from './BottomSheet';
import { useTheme } from '@/theme/useTheme';
import type { ColorTokens } from '@/theme/colors';

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
  const { colors } = useTheme();
  const styles = createStyles(colors);

  // `amounts` bağımlılığı bilinçli: aynı ekran konumundaki bileşen aynı
  // kalsa bile (örn. bir önceki günün özetinden yeni bir güne geçilince)
  // "gözat" seçimi (`selected`) önceki verinin para birimine kilitli
  // kalmasın — veri kümesi her değiştiğinde aktif para birimine sıfırlanır.
  useEffect(() => {
    setSelected(activeCurrency);
  }, [activeCurrency, amounts]);

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
          <Ionicons name="chevron-down" size={11} color={colors.textMuted} style={styles.chevron} />
        )}
      </TouchableOpacity>

      <BottomSheet visible={visible} onClose={() => setVisible(false)} title={t('currency.otherCurrencies')}>
        <FlatList
          data={SUPPORTED_CURRENCIES}
          keyExtractor={(item) => item}
          ItemSeparatorComponent={BottomSheetDivider}
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
      </BottomSheet>
    </View>
  );
}

function createStyles(colors: ColorTokens) {
  return StyleSheet.create({
    row: { alignItems: 'center' },
    chevron: { marginTop: 2 },
    optionRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 4,
    },
    optionCode: { color: colors.textSecondary, fontSize: 14, fontWeight: '700' },
    optionValue: { color: colors.textPrimary, fontSize: 15, fontWeight: '600' },
    optionActive: { color: colors.accent },
  });
}

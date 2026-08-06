/**
 * options.ts — Dile duyarlı seçenek listeleri (araç tipi, yakıt tipi,
 * gider kategorisi, gelir kaynağı). Dil değiştiğinde bu hook'lar tekrar
 * çalışıp güncel çeviriyle yeniden render eder.
 */

import { useTranslation } from 'react-i18next';
import { SUPPORTED_CURRENCIES, CURRENCY_SYMBOLS, type SupportedCurrency } from '@stores/currencyStore';
import type {
  SelectOption,
  VehicleType,
  FuelType,
  ExpenseCategory,
  IncomeSource,
} from '@/types';

export function useVehicleTypeOptions(): SelectOption[] {
  const { t } = useTranslation();
  const types: VehicleType[] = ['car', 'motorcycle', 'truck', 'van'];
  return types.map((value) => ({ value, label: t(`vehicleTypes.${value}`) }));
}

export function useFuelTypeOptions(): SelectOption[] {
  const { t } = useTranslation();
  const types: FuelType[] = ['gasoline', 'diesel', 'electric', 'lpg'];
  return types.map((value) => ({ value, label: t(`fuelTypes.${value}`) }));
}

export function useExpenseCategoryOptions(): SelectOption[] {
  const { t } = useTranslation();
  const categories: ExpenseCategory[] = [
    'bridge', 'parking', 'maintenance', 'fine', 'tire', 'wash', 'other',
  ];
  return categories.map((value) => ({ value, label: t(`expenseCategories.${value}`) }));
}

export function useIncomeSourceOptions(): SelectOption[] {
  const { t } = useTranslation();
  const sources: IncomeSource[] = ['trip', 'bonus', 'other'];
  return sources.map((value) => ({ value, label: t(`incomeSources.${value}`) }));
}

export function useCurrencyOptions(): { code: SupportedCurrency; symbol: string; name: string }[] {
  const { t } = useTranslation();
  return SUPPORTED_CURRENCIES.map((code) => ({
    code,
    symbol: CURRENCY_SYMBOLS[code],
    name: t(`currency.${code}`),
  }));
}

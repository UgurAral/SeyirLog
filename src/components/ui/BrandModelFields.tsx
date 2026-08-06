import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Input } from '@components/ui/Input';
import { VEHICLE_BRANDS, VEHICLE_BRAND_NAMES } from '@/data/vehicleBrands';

interface BrandModelFieldsProps {
  brand: string;
  model: string;
  onChangeBrand: (v: string) => void;
  onChangeModel: (v: string) => void;
  brandLabel: string;
  brandPlaceholder: string;
  modelLabel: string;
  modelPlaceholder: string;
  /** Herhangi bir öneri listesi açılıp kapandığında tetiklenir — ekranın bu alanı
   * saran kartını (Card) öne çıkarması (zIndex/elevation) için kullanılır. */
  onDropdownVisibleChange?: (visible: boolean) => void;
}

const DROPDOWN_MAX_HEIGHT = 216;

export function BrandModelFields({
  brand,
  model,
  onChangeBrand,
  onChangeModel,
  brandLabel,
  brandPlaceholder,
  modelLabel,
  modelPlaceholder,
  onDropdownVisibleChange,
}: BrandModelFieldsProps) {
  const [brandFocused, setBrandFocused] = useState(false);
  const [modelFocused, setModelFocused] = useState(false);

  useEffect(() => {
    onDropdownVisibleChange?.(brandFocused || modelFocused);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandFocused, modelFocused]);

  const brandQuery = brand.trim().toLowerCase();
  const brandSuggestions = brandQuery
    ? VEHICLE_BRAND_NAMES.filter((b) => b.toLowerCase().startsWith(brandQuery))
    : VEHICLE_BRAND_NAMES;

  // Marka listede birebir eşleşiyorsa modelleri o markayla sınırla; eşleşmiyorsa
  // (kullanıcı listede olmayan bir marka yazdıysa) model alanı tamamen serbest kalır.
  const matchedBrand = VEHICLE_BRAND_NAMES.find((b) => b.toLowerCase() === brandQuery);
  const modelPool = matchedBrand ? VEHICLE_BRANDS[matchedBrand] : null;
  const modelQuery = model.trim().toLowerCase();
  const modelSuggestions = modelPool
    ? (modelQuery
        ? modelPool.filter((m) => m.toLowerCase().includes(modelQuery))
        : modelPool)
    : [];

  return (
    <>
      <View style={[styles.fieldWrap, { zIndex: brandFocused ? 30 : 10 }]}>
        <Input
          label={brandLabel}
          placeholder={brandPlaceholder}
          value={brand}
          onChangeText={onChangeBrand}
          onFocus={() => setBrandFocused(true)}
          onBlur={() => setTimeout(() => setBrandFocused(false), 150)}
          autoCapitalize="words"
        />
        {brandFocused && brandSuggestions.length > 0 && (
          <ScrollView
            style={styles.dropdown}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={brandSuggestions.length > 5}
          >
            {brandSuggestions.map((b) => (
              <TouchableOpacity
                key={b}
                style={styles.dropdownItem}
                onPress={() => {
                  onChangeBrand(b);
                  setBrandFocused(false);
                }}
              >
                <Text style={styles.dropdownItemText}>{b}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      <View style={[styles.fieldWrap, { zIndex: modelFocused ? 30 : 10 }]}>
        <Input
          label={modelLabel}
          placeholder={modelPlaceholder}
          value={model}
          onChangeText={onChangeModel}
          onFocus={() => setModelFocused(true)}
          onBlur={() => setTimeout(() => setModelFocused(false), 150)}
          autoCapitalize="words"
        />
        {modelFocused && modelSuggestions.length > 0 && (
          <ScrollView
            style={styles.dropdown}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={modelSuggestions.length > 5}
          >
            {modelSuggestions.map((m) => (
              <TouchableOpacity
                key={m}
                style={styles.dropdownItem}
                onPress={() => {
                  onChangeModel(m);
                  setModelFocused(false);
                }}
              >
                <Text style={styles.dropdownItemText}>{m}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  fieldWrap: { position: 'relative', zIndex: 10 },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#1E293B',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    marginTop: 4,
    maxHeight: DROPDOWN_MAX_HEIGHT,
    zIndex: 20,
    elevation: 8,
  },
  dropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  dropdownItemText: { color: '#F1F5F9', fontSize: 14 },
});

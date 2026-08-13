import { useCallback } from 'react';
import { useNavigation } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

/**
 * Sekme odaklandığında onu saran Stack ekranının başlığını günceller.
 * (tabs) grubu tek bir Stack.Screen olarak kayıtlı olduğundan, aksi halde
 * pushed ekranlardan (örn. sefer detayı) geri dönerken geri tuşu route grup
 * adını ("(tabs)") gösterir — bunun yerine aktif sekmenin adını gösterir.
 */
export function useTabTitle(title: string) {
  const navigation = useNavigation();
  useFocusEffect(
    useCallback(() => {
      navigation.getParent()?.setOptions({ title });
    }, [navigation, title]),
  );
}

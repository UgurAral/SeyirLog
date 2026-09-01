import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

/**
 * Android'de windowSoftInputMode="adjustResize" bazı ekranlarda (örn.
 * Expo Router'ın modal/stack sunumları) pencereyi güvenilir şekilde
 * küçültmüyor — bu yüzden klavye açıkken sabit bir alt bar (Kaydet butonu
 * gibi) KeyboardAvoidingView'a güvenmeden, doğrudan klavye yüksekliği
 * kadar yukarı itilmeli. iOS'ta KeyboardAvoidingView zaten doğru
 * çalıştığından bu hook orada her zaman 0 döner.
 */
export function useKeyboardHeight(): number {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const showSub = Keyboard.addListener('keyboardDidShow', (e) => setHeight(e.endCoordinates.height));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setHeight(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return height;
}

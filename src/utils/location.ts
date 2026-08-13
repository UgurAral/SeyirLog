/**
 * Konum yardımcı fonksiyonları.
 *
 * İzin İSTEMEK sadece `requestLocationPermissionOnce` üzerinden, uygulama
 * açılışında bir kez yapılır (bkz. app/_layout.tsx). Bu dosyadaki diğer
 * fonksiyonlar izni asla kendileri istemez — sadece mevcut izin durumunu
 * okur, izin yoksa sessizce null döner. Böylece sefer formları gibi ekranlar
 * konum olmadan da hiçbir şekilde bloklanmaz/beklemez.
 */
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

const PERMISSION_ASKED_KEY = '@seyirlog_location_permission_asked';
const GRID_PRECISION = 3; // ~110m hassasiyet — ısı haritası için yeterli, bireyi ifşa etmeyecek kadar kaba

let permissionPromptInFlight = false;

/** Uygulama açılışında bir kez, kullanıcıya açıklayarak konum izni ister. Sonraki açılışlarda no-op. */
export async function requestLocationPermissionOnce(text: {
  title: string;
  message: string;
  allow: string;
  later: string;
}): Promise<void> {
  if (permissionPromptInFlight) return;
  permissionPromptInFlight = true;
  try {
    const asked = await AsyncStorage.getItem(PERMISSION_ASKED_KEY);
    if (asked) return;
    await AsyncStorage.setItem(PERMISSION_ASKED_KEY, '1');
    await new Promise<void>((resolve) => {
      Alert.alert(text.title, text.message, [
        { text: text.later, style: 'cancel', onPress: () => resolve() },
        {
          text: text.allow,
          onPress: async () => {
            try {
              await Location.requestForegroundPermissionsAsync();
            } catch {
              // sessizce yut — izin isteği başarısız olsa da uygulama akışı etkilenmemeli
            }
            resolve();
          },
        },
      ]);
    });
  } finally {
    permissionPromptInFlight = false;
  }
}

/** Konumu, izin zaten verilmişse döndürür. İzin yoksa/hata olursa sessizce null döner — asla bekletmez/patlamaz. */
export async function getCurrentCoords(): Promise<{ lat: number; lng: number } | null> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== Location.PermissionStatus.GRANTED) return null;
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    return { lat: pos.coords.latitude, lng: pos.coords.longitude };
  } catch {
    return null;
  }
}

/**
 * Verilen koordinat için "İlçe, Mahalle/Sokak" tarzı kısa bir etiket üretir.
 * Not: mahalle seviyesi hassasiyet cihazın yerel geocoder'ına bağlı, her zaman garanti değil.
 */
export async function reverseGeocodeLabel(lat: number, lng: number): Promise<string | null> {
  try {
    const results = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
    const addr = results[0];
    if (!addr) return null;
    const parts = [addr.district || addr.subregion, addr.name || addr.street].filter(Boolean);
    if (parts.length) return parts.join(', ');
    return addr.city ?? null;
  } catch {
    return null;
  }
}

/** Koordinatı kaba bir ızgaraya yuvarlar (anonim talep sinyali için — bireysel konumu ifşa etmemek amacıyla). */
export function snapToGrid(lat: number, lng: number): { lat: number; lng: number } {
  const factor = 10 ** GRID_PRECISION;
  return {
    lat: Math.round(lat * factor) / factor,
    lng: Math.round(lng * factor) / factor,
  };
}

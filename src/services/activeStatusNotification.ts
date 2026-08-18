/**
 * activeStatusNotification.ts — Aktif sefer/gün durumunu kalıcı (sticky) bir
 * bildirimde gösterir. Öncelik: aktif sefer varsa o, yoksa aktif gün, o da
 * yoksa bildirim tamamen kaldırılır. Saniyelik canlı güncelleme YAPILMAZ
 * (arka planda ek maliyet/servis gerektirir) — sadece durum değişimlerinde
 * (başlat/bitir/mola) yeniden çizilir.
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const CHANNEL_ID = 'active-status';
const NOTIFICATION_ID = 'active-status';

// Handler kaydı yoksa expo-notifications JS'den yanıt beklerken zaman aşımına
// uğrar ve bildirimi hiç göstermez (sessizce) — schedule/show çağrısından
// önce, modül yüklendiğinde bir kere kaydedilir.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

let channelReady = false;
let permissionDenied = false;

async function ensureChannel() {
  if (Platform.OS !== 'android' || channelReady) return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Aktif Durum',
    importance: Notifications.AndroidImportance.LOW,
    sound: null,
    vibrationPattern: [0],
    showBadge: false,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
  channelReady = true;
}

async function ensurePermission(): Promise<boolean> {
  if (permissionDenied) return false;
  const { status } = await Notifications.getPermissionsAsync();
  if (status === 'granted') return true;
  const { status: requested } = await Notifications.requestPermissionsAsync();
  if (requested !== 'granted') {
    permissionDenied = true;
    return false;
  }
  return true;
}

export type ActiveStatusRoute = '/quick-entry' | '/(tabs)';

export async function showActiveStatusNotification(
  title: string,
  body: string,
  route: ActiveStatusRoute,
) {
  await ensureChannel();
  const granted = await ensurePermission();
  if (!granted) return;

  await Notifications.scheduleNotificationAsync({
    identifier: NOTIFICATION_ID,
    content: {
      title,
      body,
      sticky: true,
      autoDismiss: false,
      data: { route },
    },
    // trigger: null (anında teslim) Android'de expo'nun fallback kanalını
    // kullanır — kendi kanalımızı (sessiz/düşük öncelik) kullanması için
    // channelId trigger'a verilmeli, content'e değil.
    trigger: Platform.OS === 'android' ? { channelId: CHANNEL_ID } : null,
  });
}

export async function clearActiveStatusNotification() {
  await Notifications.dismissNotificationAsync(NOTIFICATION_ID).catch(() => {});
}

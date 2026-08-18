import type { useRouter } from 'expo-router';

type Router = ReturnType<typeof useRouter>;

/**
 * Bildirim/deep-link/soğuk açılış üzerinden doğrudan bir modal ekrana
 * inilirse (tabs) hiç stack'e girmemiş olabilir — bu durumda router.back()
 * sessizce hiçbir şey yapmaz ve geri butonu "çalışmıyor" gibi görünür.
 * canGoBack() ile kontrol edip yoksa dashboard'a düşer.
 */
export function safeBack(router: Router): void {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace('/(tabs)');
  }
}

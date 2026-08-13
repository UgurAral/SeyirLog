/**
 * Uygulama genelindeki renk token'ları — açık ve koyu tema için tek bir
 * anahtar şeklini paylaşan iki paket. Ekranlar/bileşenler ham hex literal
 * yazmak yerine bu token'ları `useTheme()` üzerinden tüketir (bkz. useTheme.ts).
 *
 * Koyu tema, uygulamanın önceki (tek) paletiyle birebir aynı — mevcut
 * görünüm hiç değişmiyor. Açık tema, aynı anlamsal rolleri beyaz zeminde
 * yeterli kontrastla karşılayacak şekilde ayrıca seçildi (örn. success/
 * danger/warning düz metin olarak kullanıldığında WCAG AA kontrastını
 * karşılasın diye açık temada biraz daha koyu tonlar kullanılıyor).
 */

export interface ColorTokens {
  /** Ekran arka planı */
  background: string;
  /** Kart/sheet yüzeyi */
  surface: string;
  /** İkincil/yükseltilmiş yüzey (örn. kart içindeki alt satır, chip zemini) */
  surfaceAlt: string;
  /** Kenarlık / ayırıcı çizgi */
  border: string;

  textPrimary: string;
  /** Orta tonda ikincil metin (etiketler, alt başlıklar) */
  textSecondary: string;
  /** En soluk metin (ipucu, plasehholder, pasif ikon) */
  textMuted: string;
  /** Dolu accent/success/danger butonların üzerindeki metin */
  onAccent: string;

  accent: string;
  /** İkincil marka rengi (örn. içe aktarma aksiyonu) */
  accentSecondary: string;
  /** Üçüncül vurgu rengi (örn. Dashboard'daki sefer sayısı karosu) */
  accentTertiary: string;
  success: string;
  danger: string;
  warning: string;

  successSoftBg: string;
  successSoftText: string;
  dangerSoftBg: string;
  dangerSoftText: string;
  infoSoftBg: string;
  infoSoftText: string;

  /** Modal/bottom-sheet arkası karartma */
  overlay: string;
  /** Değişken bir zemin üzerinde yüzen, buzlu-cam görünümlü rozet/chip arka planı */
  chipTranslucent: string;
  shadow: string;
}

export const darkColors: ColorTokens = {
  background: '#0F172A',
  surface: '#1E293B',
  surfaceAlt: '#334155',
  border: '#334155',

  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  onAccent: '#FFFFFF',

  accent: '#3B82F6',
  accentSecondary: '#6366F1',
  accentTertiary: '#8B5CF6',
  success: '#22C55E',
  danger: '#EF4444',
  warning: '#F59E0B',

  successSoftBg: '#15803D',
  successSoftText: '#DCFCE7',
  dangerSoftBg: '#7F1D1D',
  dangerSoftText: '#F87171',
  infoSoftBg: '#1E3A5F',
  infoSoftText: '#93C5FD',

  overlay: 'rgba(0,0,0,0.6)',
  chipTranslucent: 'rgba(15,23,42,0.7)',
  shadow: '#000000',
};

export const lightColors: ColorTokens = {
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceAlt: '#F1F5F9',
  border: '#E2E8F0',

  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#64748B',
  onAccent: '#FFFFFF',

  accent: '#2563EB',
  accentSecondary: '#4F46E5',
  accentTertiary: '#7C3AED',
  success: '#16A34A',
  danger: '#DC2626',
  warning: '#D97706',

  successSoftBg: '#DCFCE7',
  successSoftText: '#15803D',
  dangerSoftBg: '#FEE2E2',
  dangerSoftText: '#B91C1C',
  infoSoftBg: '#DBEAFE',
  infoSoftText: '#1D4ED8',

  overlay: 'rgba(0,0,0,0.6)',
  chipTranslucent: 'rgba(255,255,255,0.75)',
  shadow: '#000000',
};

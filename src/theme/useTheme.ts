import { useColorScheme } from 'react-native';
import { useThemeStore } from '@stores/themeStore';
import { darkColors, lightColors, type ColorTokens } from './colors';

export interface Theme {
  colors: ColorTokens;
  /** Çözümlenmiş şema — mode 'system' iken cihazın anlık ayarını yansıtır. */
  scheme: 'light' | 'dark';
  isDark: boolean;
}

/** Ekranlarda/bileşenlerde tema renklerini okumak için tek giriş noktası. */
export function useTheme(): Theme {
  const mode = useThemeStore((s) => s.mode);
  const systemScheme = useColorScheme();

  const scheme: 'light' | 'dark' =
    mode === 'system' ? (systemScheme === 'light' ? 'light' : 'dark') : mode;

  return {
    colors: scheme === 'dark' ? darkColors : lightColors,
    scheme,
    isDark: scheme === 'dark',
  };
}

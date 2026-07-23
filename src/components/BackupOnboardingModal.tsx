import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@seyirlog_onboarding_v1';

export function BackupOnboardingModal() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (!val) setVisible(true);
    });
  }, []);

  const handleDismiss = async () => {
    await AsyncStorage.setItem(STORAGE_KEY, 'yes');
    setVisible(false);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={handleDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.emoji}>🚖</Text>
          <Text style={styles.title}>SeyirLog'a Hoş Geldin!</Text>
          <Text style={styles.body}>
            Tüm verilertin bu cihazda saklanır — internet gerekmez, tamamen senindir.
          </Text>

          <View style={styles.divider} />

          <Text style={styles.hint}>
            💾{'  '}Verilerin yalnızca bu telefonda tutulur. Zaman zaman{' '}
            <Text style={styles.hintBold}>Profil → Yedekle</Text> ile bir JSON
            dosyası oluşturup WhatsApp veya Drive'a gönder. Telefon değişse ya
            da uygulama silinse bile{' '}
            <Text style={styles.hintBold}>Geri Yükle</Text> ile her şeyi
            kurtarırsın.
          </Text>

          <TouchableOpacity style={styles.btn} onPress={handleDismiss} activeOpacity={0.85}>
            <Text style={styles.btnText}>Hadi Başlayalım</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
    borderTopWidth: 1,
    borderColor: '#1E293B',
    gap: 12,
  },
  emoji: { fontSize: 40, textAlign: 'center' },
  title: {
    color: '#F1F5F9',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  body: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
  },
  divider: {
    height: 1,
    backgroundColor: '#1E293B',
    marginVertical: 4,
  },
  hint: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 21,
    textAlign: 'center',
  },
  hintBold: {
    color: '#94A3B8',
    fontWeight: '700',
  },
  btn: {
    backgroundColor: '#3B82F6',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 4,
  },
  btnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});

/**
 * BackupOnboardingModal
 *
 * Uygulama ilk kurulumda bir kez gösterilir.
 * Kullanıcıya yerel SQLite depolama ve yedekleme sistemi hakkında bilgi verir.
 */

import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@seyirlog:backup_onboarding_shown_v1';

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
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Başlık */}
          <View style={styles.iconRow}>
            <Text style={styles.titleIcon}>🛡️</Text>
          </View>
          <Text style={styles.title}>Verileriniz Güvende mi?</Text>
          <Text style={styles.subtitle}>
            SeyirLog tüm verilerinizi yalnızca bu cihazda saklar.
          </Text>

          <ScrollView
            style={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            {/* Uyarı kutusu */}
            <View style={styles.warningBox}>
              <Text style={styles.warningIcon}>⚠️</Text>
              <Text style={styles.warningText}>
                Uygulamayı sildiğinizde{' '}
                <Text style={styles.warningBold}>
                  tüm sefer, yakıt ve gider kayıtlarınız kalıcı olarak silinir.
                </Text>
              </Text>
            </View>

            {/* Nasıl korunursunuz */}
            <Text style={styles.sectionTitle}>Nasıl korunursunuz?</Text>

            <StepRow
              step="1"
              icon="👤"
              title="Profil sekmesine gidin"
              desc="Alt çubuktan Profil'e dokunun."
            />
            <StepRow
              step="2"
              icon="📤"
              title='"Yedekle" butonuna basın'
              desc='Tüm verileriniz tek bir JSON dosyasına aktarılır.'
            />
            <StepRow
              step="3"
              icon="💾"
              title="Güvenli bir yere kaydedin"
              desc="WhatsApp, Gmail, Google Drive veya iCloud'a gönderin."
            />
            <StepRow
              step="4"
              icon="📥"
              title='Gerektiğinde "Geri Yükle"'
              desc="Uygulama yeniden kurulunca yedeği seçip verilerinizi geri alın."
            />

            {/* İpucu */}
            <View style={styles.tipBox}>
              <Text style={styles.tipText}>
                💡 <Text style={styles.tipBold}>Öneri:</Text> Haftada bir yedek alıp kendinize
                WhatsApp'tan gönderin. En güvenli yöntem bu.
              </Text>
            </View>
          </ScrollView>

          {/* Buton */}
          <TouchableOpacity
            style={styles.btn}
            onPress={handleDismiss}
            activeOpacity={0.85}
          >
            <Text style={styles.btnText}>Anladım, Başlayalım 🚖</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function StepRow({
  step,
  icon,
  title,
  desc,
}: {
  step: string;
  icon: string;
  title: string;
  desc: string;
}) {
  return (
    <View style={styles.stepRow}>
      <View style={styles.stepBadge}>
        <Text style={styles.stepNum}>{step}</Text>
      </View>
      <Text style={styles.stepIcon}>{icon}</Text>
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>{title}</Text>
        <Text style={styles.stepDesc}>{desc}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
    ...Platform.select({ ios: {}, android: {} }),
  },
  sheet: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '88%',
    borderTopWidth: 1,
    borderColor: '#1E293B',
  },

  iconRow: { alignItems: 'center', marginBottom: 10 },
  titleIcon: { fontSize: 44 },

  title: {
    color: '#F1F5F9',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },

  scroll: { maxHeight: 380 },

  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EF444415',
    borderRadius: 12,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: '#EF444430',
    marginBottom: 20,
  },
  warningIcon: { fontSize: 18, marginTop: 1 },
  warningText: { flex: 1, color: '#FCA5A5', fontSize: 13, lineHeight: 20 },
  warningBold: { fontWeight: '700', color: '#EF4444' },

  sectionTitle: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },

  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  stepNum: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  stepIcon: { fontSize: 20, flexShrink: 0, marginTop: 1 },
  stepContent: { flex: 1, gap: 2 },
  stepTitle: { color: '#F1F5F9', fontSize: 14, fontWeight: '700' },
  stepDesc: { color: '#64748B', fontSize: 13, lineHeight: 18 },

  tipBox: {
    backgroundColor: '#1E293B',
    borderRadius: 10,
    padding: 12,
    marginTop: 4,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  tipText: { color: '#94A3B8', fontSize: 13, lineHeight: 19 },
  tipBold: { color: '#F1F5F9', fontWeight: '700' },

  btn: {
    backgroundColor: '#3B82F6',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  btnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
});

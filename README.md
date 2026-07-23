# SeyirLog 🚖

**Şoförler için offline-first seyir, yakıt ve gider takip uygulaması.**

Kağıt defteri bırak. Telefonundan takip et.

---

## Özellikler

- 🚖 **Sefer takibi** — kalkış/varış, km, kazanç, süre
- ⛽ **Yakıt girişi** — litre, fiyat, toplam maliyet
- 💸 **Gider yönetimi** — köprü, otopark, bakım, ceza ve daha fazlası
- 💰 **Gelir kaydı** — sefer dışı kazançlar
- 📊 **Dönem filtreleri** — Bugün / Hafta / Ay / Tümü
- ⚡ **Hızlı Giriş** — tek FAB butonuyla 4 kategori tek ekranda
- 🔌 **Tamamen offline** — internet bağlantısı gerekmez, veriler cihazda saklanır

---

## Teknoloji

| Katman | Teknoloji |
|--------|-----------|
| Mobil | React Native (Expo SDK 54) |
| Yönlendirme | Expo Router v6 |
| Veritabanı | SQLite (expo-sqlite + Drizzle ORM) |
| Stil | NativeWind (Tailwind CSS) |
| State | Zustand |

---

## Kurulum

```bash
# Bağımlılıkları kur
npm install --legacy-peer-deps

# Geliştirme sunucusunu başlat
npx expo start

# Tunnel modu (uzak sunucu / farklı ağ)
npx expo start --tunnel
```

> **Not:** Expo Go (SDK 54) ile test edilmiştir.

---

## Build (EAS)

```bash
# Preview APK (Android)
eas build --platform android --profile preview

# Production
eas build --platform android --profile production
eas build --platform ios --profile production
```

---

## Proje Yapısı

```
app/
  (tabs)/          # Ana sekmeler (Dashboard, Seferler, Yakıt, ...)
  quick-entry.tsx  # Hızlı giriş modal (Sefer/Yakıt/Gider/Gelir)
  trip/            # Sefer detay ekranları
  fuel/            # Yakıt ekranları
  expense/         # Gider ekranları
  income/          # Gelir ekranları
  vehicle/         # Araç yönetimi
src/
  db/              # Drizzle schema, migrations, index
  stores/          # Zustand stores
  hooks/           # Custom React hooks
  components/      # UI bileşenleri
  utils/           # Hesaplama ve format yardımcıları
  types/           # TypeScript tipleri
```

---

## Lisans

MIT

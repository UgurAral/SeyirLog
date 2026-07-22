# SeyirLog 🚖

**Tag anlaşmalı taksi şoförleri için kişisel ERP uygulaması.**

Seferlerinizi, yakıt giderlerinizi, gelirlerinizi ve araç bilgilerinizi tek yerden yönetin.

## Özellikler

- 📍 **Sefer Takibi** — Başlangıç/bitiş km, süre, kazanç
- ⛽ **Yakıt Yönetimi** — Litre, fiyat, istasyon, km takibi
- 💸 **Gider Takibi** — Köprü, otopark, bakım, ceza ve daha fazlası
- 📊 **Dashboard** — Net kazanç, günlük/dönemsel özet istatistikler
- 🚗 **Araç Yönetimi** — Birden fazla araç desteği

## Teknoloji Yığını

| Katman | Teknoloji |
|--------|-----------|
| Framework | Expo (SDK 52) + React Native 0.76 |
| Routing | Expo Router (file-based) |
| Database | SQLite via expo-sqlite |
| ORM | Drizzle ORM |
| State | Zustand |
| Styling | NativeWind + StyleSheet |
| Language | TypeScript (strict) |

## Kurulum

```bash
# Bağımlılıkları yükle
npm install

# Uygulamayı başlat
npm start

# iOS Simulator
npm run ios

# Android Emulator
npm run android
```

## Proje Yapısı

```
SeyirLog/
├── app/                   # Expo Router sayfaları
│   ├── (tabs)/            # Tab navigasyonu
│   │   ├── index.tsx      # Dashboard
│   │   ├── trips.tsx      # Seferler listesi
│   │   ├── fuel.tsx       # Yakıt girişleri
│   │   ├── expenses.tsx   # Giderler
│   │   └── profile.tsx    # Araç & Profil
│   ├── trip/
│   │   ├── new.tsx        # Yeni sefer formu
│   │   └── [id].tsx       # Sefer detay/tamamlama
│   ├── fuel/new.tsx       # Yakıt ekleme formu
│   └── expense/new.tsx    # Gider ekleme formu
├── src/
│   ├── db/
│   │   ├── schema.ts      # Drizzle ORM tabloları
│   │   └── index.ts       # DB bağlantısı
│   ├── stores/            # Zustand state yönetimi
│   ├── hooks/             # Veri çekme hooks'ları
│   ├── components/        # Yeniden kullanılabilir bileşenler
│   ├── types/             # TypeScript tipleri
│   └── utils/             # Hesaplama ve formatlama araçları
```

## DB Schema Özeti

```
vehicles       → Araç kayıtları
trips          → Sefer kayıtları (origin, destination, km, earnings)
fuel_entries   → Yakıt girişleri (liters, price, km)
expenses       → Gider kayıtları (category, amount)
income_entries → Sefer dışı gelirler (bonus, other)
```

## Renkler

| Renk | Hex | Kullanım |
|------|-----|---------|
| Arka Plan | `#0F172A` | Ekran zemini |
| Kart | `#1E293B` | Card bileşeni |
| Başlık | `#1a1a2e` | Header/Nav |
| Mavi | `#3B82F6` | Primary aksiyonlar |
| Yeşil | `#22C55E` | Kazanç, başarı |
| Kırmızı | `#EF4444` | Gider, hata, iptal |
| Sarı | `#F59E0B` | Yakıt, uyarı |

## Geliştirme Notları

- Tüm zaman değerleri **Unix timestamp (saniye)** olarak saklanır
- Para birimleri **Türk Lirası (TL)** olarak işlenir
- KM değerleri **real (float)** tipindedir
- Boolean değerler SQLite'ta **integer (0/1)** olarak tutulur
- Drizzle migrations için: `npx drizzle-kit generate`

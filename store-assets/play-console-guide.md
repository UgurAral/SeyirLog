# Play Console Yayınlama Rehberi

## 1. Görsel Varlıklar (Store Listing → Graphics)

| Varlık | Gereksinim | Mevcut Durum |
|---|---|---|
| **Uygulama ikonu** | 512×512 px, 32-bit PNG (alfa kanallı), max 1 MB | ✅ `store-assets/icon-512.png` hazır |
| **Feature graphic (kapak görseli)** | 1024×500 px, JPG veya 24-bit PNG (alfasız) | ✅ `store-assets/feature-graphic.png` hazır (programatik oluşturuldu — beğenmezsen tasarımcıya iyileştirtebilirsin) |
| **Telefon ekran görüntüleri** | Min 2, max 8 adet. JPEG/24-bit PNG (alfasız). Her boyut 320–3840 px arası. **En uzun kenar, en kısa kenarın 2 katından fazla olamaz** (max oran 2:1) | ❌ **Yok, senin oluşturman lazım** — uygulamada demo veri girip Dashboard/Hızlı Giriş/liste/Profil ekranlarından ekran görüntüsü al, sonra bana ver, oranı Play'e uygun kırpayım |
| 7" tablet ekran görüntüleri | Opsiyonel | Yok (gerekmiyor, telefon-only uygulama) |
| 10" tablet ekran görüntüleri | Opsiyonel | Yok (gerekmiyor) |
| Promo video | Opsiyonel, YouTube linki | Yok (opsiyonel, atlanabilir) |

### ⚠️ Ekran görüntüsü oran sorunu
Test emulator'ünün çözünürlüğü **1080×2340** (oran 1:2.166) — Play'in izin verdiği max **1:2.0** oranını aşıyor, bu haliyle yüklenen ham ekran görüntüleri **reddedilebilir**. Çözüm: ekran görüntülerini kırparak (örn. üstten/alttan durum çubuğu ve gezinme çubuğunu keserek) ~1080×2124 (1:1.967) veya daha standart bir orana (1080×1920, 1:1.78) getirmek gerekiyor.

### Öneri: Ekran görüntüsü seçimi (store-listing.md'deki caption'larla eşleşen)
1. Dashboard — "Günlük kazancınızı tek bakışta görün"
2. Hızlı Giriş modalı — "Sefer, yakıt, gider — tek ekranda hızlı giriş"
3. Sefer/Yakıt listesi + dönem filtresi — "Haftalık ve aylık analiz"
4. Profil → Yedekleme kartı — "JSON yedekleme ile verileriniz güvende"

---

## 2. Data Safety (Veri Güvenliği) Formu İçeriği

Play Console → App content → Data safety. Aşağıdaki cevaplar mevcut kod ve privacy policy ile birebir uyumlu (`store-assets/privacy-policy.md`).

### Veri toplanıyor mu?
**Evet.**

### Veriler şifrelenerek mi aktarılıyor?
**Evet** — Firebase Authentication/Firestore bağlantıları HTTPS/TLS üzerinden.

### Kullanıcı veri silme talep edebiliyor mu?
**Evet** — uygulama içi bilgilendirme + web sayfası: `https://uguraral.github.io/SeyirLog/delete-account.html`

### Toplanan veri kategorileri

| Kategori | Veri Tipi | Toplanıyor mu | Paylaşılıyor mu | Zorunlu/Opsiyonel | Amaç |
|---|---|---|---|---|---|
| **Kişisel bilgiler** | E-posta adresi | ✅ | ❌ Hayır | Zorunlu | Hesap yönetimi (Firebase Auth ile giriş/kayıt) |
| **Uygulama etkinliği** | Uygulama içi işlemler (sefer/yakıt/gider/gelir kayıtları) | ✅ | ❌ Hayır | Zorunlu | Uygulama işlevselliği (offline-first veri takibi + cihazlar arası senkron) |
| **Cihaz/diğer kimlikler** | Reklam Kimliği (Advertising ID) | ✅ | ✅ Evet (Google AdMob'a) | Opsiyonel | Reklam/pazarlama (kişiselleştirilmemiş reklam sunumu) |

### Toplanmayan veri kategorileri (formda "Hayır" işaretlenecek)
- Konum (Location) — toplanmıyor
- Finansal bilgiler (ödeme yöntemi, banka hesabı) — toplanmıyor (kullanıcının kendi gelir/gider kayıtları "finansal hesap bilgisi" değil, kullanıcı içeriğidir)
- Fotoğraf/video, ses kayıtları — toplanmıyor
- Kişi listesi (Contacts) — toplanmıyor
- Sağlık/fitness verisi — toplanmıyor
- Mesajlar (SMS/e-posta içeriği) — toplanmıyor
- Arama/tarama geçmişi (web browsing history) — toplanmıyor

### Güvenlik pratikleri
- Veriler aktarım sırasında şifreleniyor: **Evet**
- Kullanıcılar verilerinin silinmesini talep edebilir: **Evet**
- Bağımsız güvenlik denetiminden geçti mi: **Hayır** (küçük ölçekli/bireysel geliştirici, opsiyonel alan — boş bırakılabilir)

---

## 3. İçerik Derecelendirmesi (Content Rating)
Play Console'un IARC anketinde:
- Şiddet, cinsel içerik, kaba dil: **Yok**
- Kullanıcı üretimi içerik paylaşımı (başka kullanıcılarla): **Yok** (veriler yalnızca kendi hesabına özel)
- Beklenen sonuç: **Herkes (Everyone / 3+ veya 4+)**

## 4. Uygulama Kategorisi
- Google Play: **Araçlar** (Auto & Vehicles) veya **Üretkenlik** (Productivity) — `store-listing.md`'de belirtildiği gibi Araçlar öneriliyor

## 5. Diğer Play Console Zorunlu Alanlar
- **Privacy Policy URL**: `https://uguraral.github.io/SeyirLog/` ✅ hazır
- **App access**: Uygulama giriş gerektiriyor (Firebase Auth) — test için Play Console'a bir test hesabı e-posta/şifre bilgisi girilmeli ("App access" bölümü, incelemeci giriş yapabilsin diye)
- **Ads declaration**: "Yes, my app contains ads" işaretlenmeli (AdMob banner + rewarded var)
- **Target audience & content**: 13 yaş altına yönelik değil
- **Government apps / financial features declaration**: Hayır

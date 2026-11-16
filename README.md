# VECTOR 2.0
## Premium Grid-Based Arcade Puzzle Game

**Geliştirici:** Erdem  
**Platform:** Mobile-First Web / Native Capacitor (Android & iOS)  
**Teknoloji:** HTML5, CSS3, Vanilla JavaScript, Canvas 2D API, Capacitor Core & AdMob  
**Mimari Standart:** Erdem Development Rules & Preferences (Zero-Mock, Modüler Mimari, SQL-First)

---

## 🎮 Yeni Konsept & Mekanikler (VECTOR 2.0)

**VECTOR 2.0**, 4 dünya ve 120 doğrulanmış bölüm üzerinden geliştirilmiş taktiksel derinlik, kuantum ışınlanma, lazer kapıları ve dinamik reklam akışıyla tasarlandı:

### 1. Enerji Çekirdekleri (Portal Cores - `K`)
- Haritadaki tüm parlayan **Enerji Çekirdekleri** toplanmadan Çıkış Portalı (`E`) kapalıdır ve içinden normal zemin gibi kayıp geçilir.
- Son çekirdek toplandığında portal bir şok dalgasıyla aktifleşir.

### 2. Kırılan / Çatlak Duvarlar (Cracked Walls - `C`)
- Küp çarptığında bir duvar gibi hareketi durdurur; ancak çarpmayla birlikte çatlar ve yok olur!
- Bir sonraki geçişte o hücre artık açık koridora dönüşür, bu da rotayı kalıcı olarak değiştirir.

### 3. Lazer Tuzakları (Laser Hazards - `X`)
- Rota üzerinde dokunulmaması gereken ölümcül neon tehlike hücreleridir. Temas anında küp parçalanır.

### 4. Kuantum Işınlanma Portalları (Quantum Warp Portals - `T`)
- Küpün kayma hızını ve yönünü koruyarak bağlı portal hücresine anında taşır.

### 5. Lazer Şalter & Bariyer Kapıları (Switch & Forcefield Gate - `P` & `G`)
- Şalter hücresine (`P`) basıldığında haritadaki lazer bariyerleri (`G`) açılır veya kapanır.

### 6. Dinamik Hamle & Enerji Sınırı (Move / Energy Limit)
- **Bölüm 1 - 10:** Limitsiz serbest antrenman (öğrenme fazı).
- **Bölüm 11 - 20:** `Par + 4` hamle sınırı.
- **Bölüm 21 - 60:** `Par + 3` hamle sınırı.
- **Bölüm 61 - 120:** `Par + 2` sıkı hamle sınırı.

### 7. Reklam & Pacing Akışı (AdMob Interstitial & World Ceremony)
- **Bölümler Arası Geçiş Reklamı:** Bölüm geçişlerinde veya arşiv menüsüne dönüşte her 4 tamamlamada bir (`interstitialFrequency = 4`) Google AdMob Geçiş Reklamı (Interstitial) devreye girer.
- **Dünya Açılma Töreni:** 30, 60 ve 90. bölümlerde dünya kilidi açılırken özel tesseract kilit kırma animasyonu ve AdMob reklamı tetiklenir.
- **Hibrit Destek:** Android ve iOS üzerinde `@capacitor-community/admob` ile yerel SDK; tarayıcıda ise test modal simülasyonu çalışır.

---

## 🎨 Cyberpunk / Dark Geometric Arcade Arayüzü

- **HUD Enerji Sayacı:** Kalan hamleler azaldıkça kırmızı nabız atışı.
- **Çekirdek Göstergesi:** Üst barda toplanan çekirdek durumu (`◆ ◆ ◇`).
- **Görsel Efektler:** Çatlayan duvar taşları (debris), portal açılma şok dalgaları, ölüm patlaması ve neon hareket izleri.

---

## 📂 Dizin Yapısı

```
oyun1/
├── index.html                 # Mobil oyun arayüzü
├── css/
│   ├── reset.css, variables.css, layout.css
│   ├── components.css, game.css, animations.css
├── js/
│   ├── app.js                 # Uygulama ana döngüsü & olay yönlendirmesi
│   ├── router.js              # Ekran yöneticisi
│   ├── engine/
│   │   ├── engine.js          # Oyun motoru
│   │   ├── movement.js        # Çekirdek, çatlak duvar, lazer ve kayma hesaplayıcısı
│   │   ├── state.js           # Dinamik enerji limiti, çekirdekler ve geri alma
│   │   └── tiles.js           # Karo tanımları (#, ., S, E, K, C, X)
│   ├── rendering/
│   │   ├── renderer.js        # Çatlak duvar, aktif/pasif portal, çekirdek ve tehlike çizici
│   │   └── effects.js         # Şok dalgaları, taş molozları ve parçacıklar
│   ├── systems/
│   │   ├── audio.js           # Web Audio API (Taş kırılma, portal aktivasyonu, ölüm sesleri)
│   │   ├── progress.js        # Yıldızlar, kilitler ve kalıcı hafıza
│   │   └── advertisements.js  # AdMob / Capacitor reklam soyutlaması
│   ├── ui/
│   │   ├── gameplay.js        # HUD enerji barı, çekirdek sayaçları ve game-over yönetimi
│   │   ├── level-select.js    # Bölüm kilit açılma animasyonları
│   │   └── results.js         # Seviye sonu ve haritaya geçiş
│   └── levels/
│       ├── level-solver.js    # Yeni mekanikleri destekleyen BFS çözücü
│       ├── level-parser.js    # Karo ve kısıt ayrıştırıcı
│       └── level-data.js      # 60 doğrulanmış bölümün çevrimdışı paketi
├── database/
│   ├── install.sql, tables.sql, seed.sql, migrations/
├── levels/
│   ├── origin/                # Dünya 01 (Bölüm 1 - 30 JSON dosyaları)
│   └── keys/                  # Dünya 02 (Bölüm 31 - 60 JSON dosyaları)
├── tools/
│   ├── level-editor.html      # 2.0 Web tabanlı harita editörü
│   ├── level-generator.js     # 60 bölümü üreten ve doğrulayan motor
│   └── level-validator.js     # CLI doğrulama aracı
└── tests/
    └── suite.js               # Çekirdek, lazer, kırılan duvar ve limit test paketi
```

---

## 🧪 Test & Çalıştırma

```bash
# Yerel test sunucusunu başlat (Tarayıcıda test)
cd /home/erdemskywalker/Documents/mini/oyun1
php -S localhost:8000

# Web varlıklarını build et ve Capacitor projelerine senkronize et
npm run cap:sync

# Android Studio veya Xcode ile projeyi aç
npm run cap:open:android
npm run cap:open:ios

# 120 bölümün tamamını doğrula
npm run validate

# Otomatik test paketini çalıştır
npm test
```

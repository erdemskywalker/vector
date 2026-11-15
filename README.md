# VECTOR
## Premium Grid-Based Arcade Puzzle Game

**Geliştirici:** Erdem  
**Platform:** Mobile-First Web / Capacitor Ready (Android & iOS)  
**Teknoloji:** HTML5, CSS3, Vanilla JavaScript, Canvas 2D API  
**Mimari Standart:** Erdem Development Rules & Preferences (Zero-Mock, Modüler Mimari, SQL-First)

---

## 🎮 Oyun Konsepti

**VECTOR**, ızgara tabanlı bir labirentte parlayan geometrik bir küpü kontrol ettiğiniz taktiksel bir kaydırma bulmaca oyunudur.

- **Hareket Kuralı:** 4 ana yönde (Yukarı, Aşağı, Sol, Sağ) kaydırma yapılır. Küp, bir engelle (Duvar `#`, Kilitli Kapı `D`) karşılaşana kadar durmaksızın kayar; manuel olarak ortada durdurulamaz.
- **Hedef:** Minimum hamle ile mantıksal rota planlaması yaparak çıkışa (`E`) ulaşmak.
- **Mekanikler:**
  - **Duvarlar (`#`):** Küpün hareketini durdurur.
  - **Anahtarlar (`K`):** Üzerinden geçerken veya üzerinde durulduğunda toplanır.
  - **Kilitli Kapılar (`D`):** Anahtarsız geçişi engeller, anahtar toplandığında kilidi açılır ve küp geçişine izin verir.
  - **Çıkış (`E`):** Ulaşıldığında bölümü tamamlar.
- **Yıldız Değerlendirmesi (`Par`):**
  - **3 Yıldız:** Bölümü `Par` hamle sayısında veya altında bitirmek.
  - **2 Yıldız:** `Par + 1` veya `Par + 2` hamlede bitirmek.
  - **1 Yıldız:** Daha fazla hamlede bitirmek.

---

## 🎨 Görsel Kimlik (Minimal Dark Arcade)

- **Arka Plan:** Derin karanlık (`#0B0D12` / `#11151E`)
- **Izgara Yüzeyi:** `#171C27`, Sınırlar: `#252C3A`
- **Oyuncu Küpü:** Canlı gradyan (`#73D7FF` -> `#A78BFA`), yumuşak neon parıltı ve hareket izi (trail effect)
- **Çıkış Portalı:** Nabız atan yeşil halka (`#86EFAC`)
- **Ses & Hissiyat:** Sıfır dış bağımlılık; Web Audio API ile tamamen kod üzerinden sentezlenen minimalist retro-modern efektler ve mobil titreşim (Haptics).

---

## 📂 Proje Yapısı

```
oyun1/
├── index.html                 # Ana mobil oyun arayüzü
├── css/
│   ├── reset.css              # Mobil dokunmatik sıfırlamaları
│   ├── variables.css          # Renk paleti ve tasarım tokenları
│   ├── layout.css             # Ekran ve viewport yerleşimi
│   ├── components.css         # Butonlar, pencereler ve yıldızlar
│   ├── game.css               # HUD, canvas, kartlar ve sonuç ekranı
│   └── animations.css         # CSS animasyonları ve efektler
├── js/
│   ├── app.js                 # Uygulama ana giriş noktası ve döngü (Loop)
│   ├── router.js              # Ekranlar arası geçiş yöneticisi
│   ├── engine/
│   │   ├── engine.js          # Oyun motoru
│   │   ├── movement.js        # Deterministik kayma ve yol hesaplama
│   │   ├── collision.js       # Çarpışma algılama
│   │   ├── state.js           # Durum yönetimi, Undo ve Restart
│   │   └── tiles.js           # Karo tanımları ve özellikleri
│   ├── input/
│   │   └── input.js           # Dokunmatik kaydırma, fare ve klavye girdisi
│   ├── rendering/
│   │   ├── renderer.js        # Retina/DPR uyumlu Canvas 2D çizici
│   │   └── effects.js         # Parçacık patlamaları, izler ve sarsıntı
│   ├── levels/
│   │   ├── level-manager.js   # Bölüm yükleme ve önbellekleme
│   │   ├── level-parser.js    # JSON doğrulama ve harita çözümleme
│   │   ├── level-solver.js    # BFS tabanlı deterministik en kısa yol çözücü
│   │   ├── level-validator.js # Bütünlük ve çözülebilirlik denetleyicisi
│   │   └── level-data.js      # %100 çevrimdışı ve WebView uyumlu bölüm paketi
│   ├── systems/
│   │   ├── progress.js        # İlerleme, kilitler, yıldızlar ve ayarlar
│   │   ├── storage.js         # LocalStorage soyutlaması
│   │   ├── audio.js           # Web Audio API ses sentezleyici
│   │   └── advertisements.js  # Google AdMob / Capacitor reklam soyutlaması
│   └── ui/
│       ├── menu.js            # Ana menü
│       ├── level-select.js    # Bölüm seçim ekranı (Dünya 1 & Dünya 2)
│       ├── gameplay.js        # Oyun HUD'ı, ipucu (Hint) ve kontroller
│       ├── results.js         # Bölüm tamamlama ve 3 yıldız ödülü
│       └── settings.js        # Ayarlar penceresi (Ses, titreşim, sıfırlama)
├── database/                  # SQL Altyapısı (Erdem Standartları)
│   ├── install.sql            # Veritabanı kurulum betiği
│   ├── tables.sql             # Oyuncu, oturum ve skor tabloları
│   ├── seed.sql               # 60 doğrulanmış bölümün SQL metaverileri
│   └── migrations/
│       └── 001_init.sql       # İlk sürüm göç dosyası
├── levels/
│   ├── origin/                # Dünya 01: ORIGIN (Bölüm 1 - 30 JSON dosyaları)
│   └── keys/                  # Dünya 02: KEYS (Bölüm 31 - 60 JSON dosyaları)
├── tools/
│   ├── level-editor.html      # Görsel bölüm editörü ve anlık BFS test aracı
│   ├── level-generator.js     # Otomatik bölüm üretici ve par hesaplayıcı
│   └── level-validator.js     # Tüm bölümleri doğrulayan CLI aracı
└── tests/
    └── suite.js               # Kapsamlı otomatik test paketi
```

---

## 🚀 Çalıştırma

### 1. Web Sunucusu ile Başlatma
Proje dizininde dahili PHP sunucusunu çalıştırarak oyunu doğrudan açabilirsiniz:
```bash
cd /home/erdemskywalker/Documents/mini/oyun1
php -S localhost:8000
```
Tarayıcınızda `http://localhost:8000` adresine gidin.

### 2. Geliştirici Bölüm Editörü (Level Editor)
Bölüm tasarlamak, test etmek ve JSON dışa aktarmak için:
```
http://localhost:8000/tools/level-editor.html
```

---

## 🧪 Test & Doğrulama

Tüm oyun mekanikleri ve 60 bölümün çözülebilirliği komut satırından doğrulanabilir:

```bash
# 1. 60 bölümün tamamını BFS ile doğrula
node tools/level-validator.js

# 2. Oyun motoru, çarpışma, geri alma ve ilerleme testlerini çalıştır
node tests/suite.js
```

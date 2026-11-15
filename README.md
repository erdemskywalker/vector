# VECTOR 2.0
## Premium Grid-Based Arcade Puzzle Game

**Geliştirici:** Erdem  
**Platform:** Mobile-First Web / Capacitor Ready (Android & iOS)  
**Teknoloji:** HTML5, CSS3, Vanilla JavaScript, Canvas 2D API  
**Mimari Standart:** Erdem Development Rules & Preferences (Zero-Mock, Modüler Mimari, SQL-First)

---

## 🎮 Yeni Konsept & Mekanikler (VECTOR 2.0)

**VECTOR 2.0**, geliştirilmiş taktiksel derinliği, dinamik enerji kısıtı, kırılgan duvarları ve mutlak kilitli enerji çekirdekleriyle yeniden tasarlandı:

### 1. Enerji Çekirdekleri (Portal Cores - `K`)
- Haritadaki tüm parlayan **Enerji Çekirdekleri** toplanmadan Çıkış Portalı (`E`) kapalıdır ve içinden normal zemin gibi kayıp geçilir.
- Son çekirdek toplandığında portal bir şok dalgasıyla aktifleşir.
- Baypas ve sahte rota açıkları tamamen engellenmiştir.

### 2. Kırılan / Çatlak Duvarlar (Cracked Walls - `C`)
- Küp çarptığında bir duvar gibi hareketi durdurur; ancak çarpmayla birlikte çatlar ve yok olur!
- Bir sonraki geçişte o hücre artık açık koridora dönüşür, bu da rotayı kalıcı olarak değiştirir.

### 3. Lazer Tuzakları (Laser Hazards - `X`)
- Rota üzerinde dokunulmaması gereken ölümcül neon tehlike hücreleridir.
- Küp bu hücreye temas ettiğinde anında parçalanır (`CRITICAL FAILURE`).

### 4. Dinamik Hamle & Enerji Sınırı (Move / Energy Limit)
- **Bölüm 1 - 10:** Limitsiz serbest antrenman (öğrenme fazı).
- **Bölüm 11 - 20:** `Par + 4` hamle sınırı.
- **Bölüm 21 - 40:** `Par + 3` hamle sınırı.
- **Bölüm 41 - 60:** `Par + 2` sıkı hamle sınırı.
- Enerji bittiğinde küp parçalanır (`ENERGY DEPLETED`).

### 5. Pacing & Haritaya Dönüş (Soluklanma)
- Bölüm tamamlandığında doğrudan yeni seviyeye atlanmaz.
- "CONTINUE" tıklandığında oyuncu **Seviye Seçim Ekranı**'na döner; yeni açılan bölüm neon parıltı ve kilit kırılma animasyonuyla açılır. Oyuncu bilinçli olarak yeni bölüme tıklar.

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
# Yerel sunucuyu başlat
cd /home/erdemskywalker/Documents/mini/oyun1
php -S localhost:8000

# 60 bölümün tamamını doğrula
node tools/level-validator.js

# Otomatik test paketini çalıştır
node tests/suite.js
```

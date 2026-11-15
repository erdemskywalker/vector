# Oyun 1 (mini/oyun1)

**Geliştirici:** Erdem  
**Mimari Standart:** Erdem Development Rules & Preferences (Vanilla Stack, SQL-First, Zero-Mock)

---

## 🎮 Proje Özeti & Vizyon

**Oyun 1**, modüler, hafif, harici kütüphane çöplüğünden uzak ve doğrudan kendi kontrolümüzdeki çekirdek sistemler üzerine inşa edilen 2D/Canvas tabanlı bir mini oyundur.

Proje, geliştiricisi **Erdem**'in temel yazılım prensiplerine tam uyumlu olarak:
- **Asla Sahte/Mock Veri İçermez:** Oyuncu profili, oturumlar, skorlar ve oyun durumu doğrudan SQL veritabanı ve backend API akışı üzerinden çalışır.
- **Yalın & Güçlü Teknoloji:** Vanilla HTML5, Vanilla CSS, Vanilla JavaScript ve modüler PHP backend ile geliştirilir.
- **Yüksek Performans & Kontrol:** Gereksiz framework bağımlılıkları olmadan, saf JavaScript Canvas motoru ve optimize edilmiş oyun döngüsü (Game Loop) barındırır.
- **Genişletilebilir Yapı:** Gerektiğinde sistem kaynaklarını yormayacak bir Electron sarmalayıcısı (wrapper) ile masaüstü uygulamasına dönüştürülebilir.

---

## 🛠 Teknoloji Yığını (Tech Stack)

| Katman | Teknoloji / Yaklaşım | Açıklama |
| :--- | :--- | :--- |
| **Frontend UI & Canvas** | Vanilla HTML5, Vanilla CSS3 | Harici CSS framework'ü yok; saf, modern ve hızlı stiller. |
| **Oyun Motoru (Engine)** | Vanilla JavaScript (ES6+) | `requestAnimationFrame` tabanlı oyun döngüsü, çarpışma algılama ve sahne yönetimi. |
| **Backend API** | PHP (Modüler, POST Ağırlıklı) | Oyun skorları, oturum doğrulama, kullanıcı hareketleri ve kayıt API'si. |
| **Veritabanı (SQL)** | MySQL / MariaDB (veya SQLite) | İlişkisel, tutarlı ve yedeklenebilir veri katmanı. |
| **Masaüstü (Opsiyonel)** | Electron | İhtiyaç halinde hafif masaüstü entegrasyonu. |
| **Sürüm Kontrolü** | Git | Anlamlı commit standartları (`feat:`, `fix:`, `db:`). |

---

## 📂 Dizin Yapısı (Project Architecture)

```
oyun1/
├── api/                       # PHP Backend & API Katmanı
│   ├── client.php             # Ana API yönlendirici (Router)
│   ├── middleware/            # Doğrulama, rate-limit ve oturum kontrolleri
│   │   ├── auth.php
│   │   └── validator.php
│   ├── modules/               # Modüler oyun servisleri (POST ağırlıklı)
│   │   ├── player/            # Oyuncu kaydı / profil
│   │   ├── session/           # Aktif oyun oturumu ve durum senkronizasyonu
│   │   └── score/             # Skor kaydetme ve liderlik tablosu
│   └── database.php           # PDO Veritabanı bağlantı katmanı
│
├── database/                  # SQL ve Veri Yapısı (Zorunlu Standart)
│   ├── install.sql            # Veritabanını sıfırdan kuran ana SQL betiği
│   ├── tables.sql             # Tablo şemaları (players, game_sessions, scores vb.)
│   ├── seed.sql               # Gerçek test verileri (Kesinlikle mock veri değil)
│   └── migrations/            # Sürüm bazlı SQL değişiklik dosyaları
│
├── src/                       # Frontend & Oyun Çekirdeği
│   ├── js/
│   │   ├── engine/
│   │   │   ├── loop.js        # Ana oyun döngüsü (update & render)
│   │   │   ├── state.js       # Oyun durum makinesi (Menü, Oyun, Duraklat, Bitti)
│   │   │   └── collision.js   # Çarpışma algılama algoritmaları
│   │   ├── entities/
│   │   │   ├── player.js      # Oyuncu nesnesi ve mantığı
│   │   │   └── obstacle.js    # Engeller, nesneler veya düşmanlar
│   │   ├── input.js           # Klavye, fare ve dokunmatik giriş yöneticisi
│   │   └── api.js             # Backend ile POST tabanlı haberleşen veri servisi
│   ├── css/
│   │   └── style.css          # Arayüz, HUD ve menü stilleri
│   └── assets/                # Sesler, sprite'lar, görseller ve fontlar
│
├── index.html                 # Ana oyun sayfası (Canvas ve HUD bileşenleri)
└── README.md                  # Proje dokümantasyonu
```

---

## 🗄️ Veritabanı & Gerçek Veri Kuralı

> [!IMPORTANT]
> **Erdem Yazılım Kuralı:** Frontend içine geçici/sahte (mock) veri gömülemez. Bir özellik test edilecekse, `database/seed.sql` içine gerçekçi test verisi eklenir ve veri backend API üzerinden çekilir.

### Temel Tablolar (`database/tables.sql`)
1. **`players`**: Oyuncu kimlik, takma ad, kayıt tarihi ve genel istatistikleri.
2. **`game_sessions`**: Başlatılan her oyun oturumunun token'ı, başlangıç/bitiş zamanı ve durumu.
3. **`scores`**: Oyun sonu kaydedilen skorlar, oturum bağlantısı ve doğrulama bayrakları.
4. **`game_settings`**: Oyun zorluğu, hız çarpanları ve konfigürasyon parametreleri.

---

## 🔄 API Mimarisi & Çalışma Akışı

Tüm veri alışverişi **POST** ağırlıklı, modüler ve güvenli API uç noktaları üzerinden gerçekleşir:

1. **Oyun Başlangıcı (`POST /api/modules/session/start.php`):**
   - Sunucu tarafında benzersiz bir oyun oturumu oluşturulur (`session_token`).
2. **Oyun Döngüsü:**
   - 60 FPS hedefli Vanilla JS Canvas motoru yerel olarak hesaplamaları yapar.
3. **Oyun Bitişi & Skor Kaydı (`POST /api/modules/score/submit.php`):**
   - Skor, oturum süresi ve oturum token'ı sunucuya iletilir; backend doğrulaması ardından SQL tablosuna kaydedilir.
4. **Liderlik Tablosu (`POST /api/modules/score/leaderboard.php`):**
   - Gerçek veritabanı kayıtlarından sıralanmış skor tablosu çekilir ve HUD üzerinde dinamik olarak listelenir.

---

## 🚀 Kurulum & Çalıştırma

### 1. Veritabanının Kurulması
```bash
# Veritabanı ve tabloları oluştur
mysql -u root -p < database/install.sql
mysql -u root -p < database/tables.sql
mysql -u root -p < database/seed.sql
```

### 2. Yerel Sunucunun Başlatılması
Proje kök dizininde dahili PHP sunucusunu çalıştırarak hemen test edebilirsiniz:
```bash
cd /home/erdemskywalker/Documents/mini/oyun1
php -S localhost:8000
```
Tarayıcınızda `http://localhost:8000` adresini açarak oyunu görüntüleyin.

---

## 📌 Geliştirme & Git Standartları

- Commit mesajları standart ve açıklayıcı olmalıdır:
  - `feat: player jump physics implemented`
  - `fix: canvas resizing on mobile screens`
  - `db: added difficulty column to game_sessions`
- SQL değişiklikleri yapılır yapılmaz `database/migrations/` altında versiyonlanmalı ve kodla birlikte commit edilmelidir.

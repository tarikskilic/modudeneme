# MODÜ-GRID — Tasarım Sistemi

> UI ve görsel dilin tek referansı. Ürün davranışı ve sayfa detayları için [PRODUCT.md](./PRODUCT.md).

**Son senkron**: 2026-05-20 (kod: `tailwind.config.js`, `src/styles/login.css`, admin kartları)

---

## 1. Tasarım ilkeleri

- **Koyu editorial dashboard** — generic “admin template” görünümünden kaçın
- **Büyük KPI + destekleyici grafik** hiyerarşisi
- **Sadece Lucide** ikonlar — emoji ve raster foto yok
- **Türkçe tipografi** — `Ş, Ğ, Ü, Ç, İ, Ö` doğru kullanım
- **Touch hedefi** ≥ 44px (`touch-target`, `min-h-11` butonlar)

---

## 2. Renk paleti

`tailwind.config.js` → `theme.extend.colors`:

| Token | Hex | Kullanım |
|-------|-----|----------|
| `background` | `#0A0F1E` | Sayfa zemini |
| `card` | `#111827` | Kart yüzeyi |
| `surface-alt` | `#0D1321` | Alternatif yüzey / tablo zebra |
| `primary` | `#3B82F6` | Birincil aksiyon, link, seçili nav |
| `success` | `#10B981` | Üretim, kâr, pozitif, MODÜ tarafı |
| `warning` | `#F59E0B` | Uyarı, batarya, simülasyon banner |
| `danger` | `#EF4444` | Şebeke alımı, geleneksel / negatif |
| `foreground` | `#F9FAFB` | Ana metin |
| `muted` | `#6B7280` | İkincil metin |
| `muted-light` | `#9CA3AF` | Yardımcı etiket |
| `border` | `#1F2937` | Çerçeve |
| `border-strong` | `#374151` | Güçlü ayraç |

### Semantik kullanım

- **Panel / üretim**: `success` tonları
- **Batarya / depolama**: `primary`
- **Şebeke satışı**: `warning` veya `success` (bağlama göre)
- **Şebeke alımı / geleneksel kayıp**: `danger` / kırmızı tonlar
- **Optimal panel bölgesi dışı**: `warning` slider/track

---

## 3. Tipografi

| Rol | Sınıf örneği |
|-----|----------------|
| Sayfa başlığı | `page-title` / `text-2xl md:text-3xl font-bold` |
| Bölüm başlığı | `text-base font-semibold` |
| KPI değer | `text-3xl font-bold tabular-nums` |
| Gövde | `text-sm` / `text-base text-foreground` |
| İkincil | `text-xs text-muted` |
| Monospace (login, status) | `JetBrains Mono` — `login.css` |

**Sayılar**: `tabular-nums` — slider, KPI, tablo.

**Para**: `Intl.NumberFormat('tr-TR')` → `1.234 ₺` (ondalık gerektiğinde 2 hane).

---

## 4. Bileşen kalıpları

### 4.1 Kart

```txt
rounded-[12px] border border-border bg-card p-5
```

Hover (interaktif): `hover:border-primary/40` veya Framer `layout` geçişi.

### 4.2 KPI kartı (`KPICard`)

- İkon sol üst (Lucide, renk prop)
- Büyük sayı + birim
- Alt subtitle `text-muted`
- İsteğe bağlı trend pill / gauge

### 4.3 Slider (`modu-range`)

- Track: `--fill-pct`, `--range-fill` CSS değişkenleri
- Thumb: 22px, glow gölge
- Büyük varyant: `modu-range-lg` (Finansal Simülatör)
- **Manuel giriş**: `SliderValueInput` — sağ üst veya stepper ortasında; `step={1}` HTML + snap sadece sürüklerken

### 4.4 Navigasyon

- **Navbar**: fixed `h-16`, `bg-card`, border-b
- **Sidebar** (admin): `w-60`, `lg:pl-60` main offset; mobilde `Navbar` hamburger + drawer (`#admin-mobile-drawer`)
- Aktif link: sol `border-primary`, `bg-primary/10`

### 4.5 Donanım banner

- `HardwareStatusBanner`: kırmızı/amber ton, “Simülasyon Modu Aktif”
- Tüm admin sayfalarında Navbar altında

### 4.6 CAPEX pill’ler (`CostScenarioSelector`)

- Yatay pill / kart seçici: Demo, Pilot, Teşvikli, Conservative
- Seçili: `border-success/45` veya `border-primary/45`

---

## 5. Login ekranı

Ayrı stil dosyası: `src/styles/login.css` (Tailwind dışı, HTML mock ile uyumlu).

| Öğe | Not |
|-----|-----|
| Arka plan | `ElectricGridBackground` canvas animasyonu |
| Kart | Glassmorphism, `SESSION#` / `REGISTER#` üst etiket |
| Modlar | **Sisteme Giriş** ↔ **Üye Ol** (`auth-switch-link`) |
| Rol | Pill toggle: Yönetici / Daire Sakini |
| Demo | İki kart: admin + daire1 (yalnızca giriş modunda) |
| Submit | Gradient `submit`, loading spinner, success yeşil metin |
| Durum çubuğu | Donanım aranıyor → Simülasyon modu (SIM) |

Renk değişkenleri login CSS içinde: `--primary`, `--success`, `--warning`, `--danger`, `--subtext`.

---

## 6. Responsive

| Kırılım | Tailwind | Beklenti |
|---------|----------|----------|
| Mobil | `< md` | Tek sütun, `px-4`, grafikler `ResponsiveContainer` |
| Tablet | `md:` | 2 kolon grid |
| Masaüstü | `lg:` | Sidebar + içerik |
| Geniş | `xl:` | KPI 4 kolon, `max-w-*` ile okunabilirlik |

Admin karmaşık sayfalarında mobilde özet önce, tablo `overflow-x-auto`.

---

## 7. Animasyon

| Kaynak | Kullanım |
|--------|----------|
| Framer Motion | Sayfa/kart `initial/animate`, KPI count-up, sekme geçişi |
| CSS | `flowDots` enerji akışı, login pulse status |
| Recharts | `isAnimationActive` grafik geçişleri |

Login canvas: sekme gizliyken animasyon durdurulabilir (`visibilityState`).

---

## 8. Erişilebilirlik

- Form hataları: `role="alert"` / `role="status"`
- Slider: `aria-valuenow`, `aria-label` manuel girişte
- Focus: `focus-visible` ring (`primary` 2–3px)
- Caps Lock ipucu login şifre alanında

---

## 9. Anti-pattern listesi

- Emoji veya stok foto KPI’da
- Açık tema (bu sürüm yalnızca koyu)
- Hardcoded renk dağınıklığı — mümkünse Tailwind token
- Slider’da yalnızca sürükleme — manuel giriş eksik bırakılmamalı (parametre paneli)

---

## 10. İlgili dosyalar

| Dosya | Rol |
|-------|-----|
| `tailwind.config.js` | Token kaynağı |
| `src/index.css` | Global + `modu-range`, `pill-scroll`, `shell-admin` |
| `src/styles/login.css` | Login özel UI |
| `PRODUCT.md` §4 | Eski spec metni (bu dosya ile birlikte kullan) |

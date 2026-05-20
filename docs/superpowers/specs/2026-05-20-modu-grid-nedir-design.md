# MODÜ-GRID `/nedir` — Tasarım Spesifikasyonu

**Tarih:** 2026-05-20  
**Durum:** Onaylandı — implementasyon  
**Kaynak:** ELYSIUM_MODU-GRID.pptx, overlay deck’ler, `CANONICAL_SCENARIO`

---

## 1. Amaç

Jüri / yatırımcı / ilk ziyaretçi için giriş yapmadan erişilen, paylaşılabilir pitch one-pager. Canlı sunum ve önceden link paylaşımı eşit öncelik.

**Route:** `/nedir` (birincil). Opsiyonel `/about` → redirect (v2).

---

## 2. Konumlandırma

**Tek cümle:**

> MODÜ-GRID, çok bloklu sitelerde güneş, batarya ve tüketimi mevcut şebeke üzerinde optimize eden akıllı enerji yönetim katmanıdır.

**Slogan:** Enerjiyi üretmek yetmez; onu yönetmek gerekir.

**Kullanılmayan dil:** P2P enerji paylaşımı, mikro-grid topluluğu, enerji ticareti (geri plan).

**Merkez:** Site içi optimizasyon katmanı · mahsuplaşma · peak shaving · mevzuata uygun optimizasyon · sıfır ek hat / plug-and-play overlay.

| Katman | Mesaj |
|--------|--------|
| Yazılım | Enerji optimizasyon motoru |
| Donanım | Plug-and-play overlay |
| Finans | Peak shaving + mahsuplaşma ROI |
| Regülasyon | Mevzuata uygun yerel optimizasyon |
| Vizyon | Şebekeyi değiştirmeden akıllandırma |

---

## 3. Sayfa bölümleri

| # | ID | Bölüm |
|---|-----|--------|
| 1 | `hero` | Marka, one-liner, slogan, rozetler |
| 2 | `fark` | Eski vs yeni anlatı + regülasyon |
| 3 | `problem` | 3 madde |
| 4 | `cozum` | 4 sütun (deck pilları) |
| 5 | `nasil` | 3 adım |
| 6 | `pilot` | ELYSIUM + `CANONICAL_SCENARIO` |
| 7 | `etki` | 4 KPI + hedef/simülasyon dipnotu |
| 8 | `ekip` | 4 kişi kartı |
| 9 | `demo` | Demo hesaplar + CTA |

**Kullanılmaz:** Slide 7 pie (82,2 / 16,6 / 1,2).

---

## 4. Etki KPI’ları

| KPI | Mesaj | Not |
|-----|--------|-----|
| ~%75 | Şebeke bağımsızlığı **hedefi** | Vizyon; sim’de öz-tüketim ~%37 |
| ~4–5 yıl | Pilot amortisman | Motor: pilot ROI 5,1 yıl |
| %40’a kadar | Gündüz maliyet avantajı | Deck |
| Sıfır ek hat | Mevcut altyapıyla kurulum | Farklılaştırıcı |

Dipnot: ROI/tasarruf simülasyon çıktısı; %75 hedef ayrı etiketlenir.

---

## 5. Ekip (v1)

İsim + rol + üniversite + kısa bio + initials avatar. LinkedIn opsiyonel (yok).

---

## 6. Teknik

- `src/content/aboutContent.js` — metin tek kaynak
- `src/pages/About.jsx` — bölümler
- `src/components/about/AboutNav.jsx` — sticky nav + hash
- `src/components/about/TeamCard.jsx`
- `App.jsx` — public route, auth yok
- `Login.jsx` — link “MODÜ-GRID Nedir?”

**Sonraki faz:** README / Login alt başlık terminoloji (“mikro-şebeke” → katman).

---

## 7. Kabul kriterleri

- [ ] `/nedir` SPA 404 vermez
- [ ] `/nedir#ekip` scroll
- [ ] Login → nedir → giriş dönüşü
- [ ] Mobil okunabilir, touch ≥ 44px
- [ ] Hedef vs simülasyon dipnotu görünür

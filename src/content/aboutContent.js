import { CANONICAL_SCENARIO } from '../constants/simulationDefaults.js';

export const POSITIONING = {
  oneLiner:
    'MODÜ-GRID, çok bloklu sitelerde güneş, batarya ve tüketimi mevcut şebeke üzerinde optimize eden akıllı enerji yönetim katmanıdır.',
  tagline: 'Enerjiyi üretmek yetmez; onu yönetmek gerekir.',
  projectName: 'ELYSIUM',
  event: 'Emlak Konut Ideathon — Akıllı Şehir Teknolojileri',
  location: 'İzmir',
  regulatory: 'Enerji ticareti değil; mevzuata uygun site içi optimizasyon.',
  overlay: 'Sıfır ek hat — mevcut şebeke üzerine plug-and-play akıllı katman.',
};

export const POSITIONING_SHIFT = {
  title: 'Enerji ticareti değil, mevzuata uygun optimizasyon',
  oldItems: [
    'P2P enerji paylaşımı',
    'Yeni mikro-şebeke kurulumu',
    'Enerji topluluğu modeli',
  ],
  newItems: [
    'Site içi enerji optimizasyon katmanı',
    'Mahsuplaşma ve peak shaving',
    'Yerel optimizasyon, mevcut şebeke',
  ],
};

export const PROBLEMS = [
  {
    title: 'Bloklar arası dengeleme eksikliği',
    body: 'Çok bloklu sitelerde üretim ve tüketim bloklar arasında adil ve şeffaf paylaşılmıyor.',
  },
  {
    title: 'Tek görünüm yok',
    body: 'Ortak alan, daire tüketimi ve şebeke hareketleri yönetici için parçalı kalıyor.',
  },
  {
    title: 'Yatırım kanıtı zayıf',
    body: 'GES ve BESS yatırımının ROI ve karbon etkisi sayıyla gösterilemiyor.',
  },
];

export const SOLUTION_PILLARS = [
  {
    id: 'overlay',
    title: 'Şebekeyi değiştirmiyoruz',
    body: 'Mevcut trafo ve hat altyapısının üzerine akıllı enerji yönetim katmanı kuruyoruz.',
  },
  {
    id: 'mahsuplasma',
    title: 'Basit mahsuplaşma mantığı',
    body: 'Sanal mahsuplaşma ve EPDK tarifelerine uygun dağıtım simülasyonu ile şeffaf paylaşım.',
  },
  {
    id: 'local',
    title: 'Yerel enerji optimizasyonu',
    body: 'Gündüz üretim, akşam pikinde ortak alan peak shaving ve öz-tüketim maximizasyonu.',
  },
  {
    id: 'layers',
    title: 'Güç ve veri katmanı',
    body: 'Donanım (ölçüm, batarya) ile yazılım (motor, dashboard) ayrımı — MVP ile uyumlu mimari.',
  },
];

export const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Parametreleri ayarlayın',
    body: 'Daire sayısı, GES gücü (kWp), batarya (kWh) ve CAPEX senaryosu — slider veya manuel giriş.',
  },
  {
    step: '02',
    title: 'Motor hesaplar',
    body: 'Saatlik üretim, tüketim, batarya ve şebeke akışı EPDK tarifeleriyle simüle edilir.',
  },
  {
    step: '03',
    title: 'KPI ve paneller',
    body: 'Finansal ROI, karbon, enerji akışı ve geleneksel site karşılaştırması tek arayüzde.',
  },
];

/** @type {import('lucide-react').LucideIcon} import için About.jsx'te eşleştirilir */
export const IMPACT_KPIS = [
  {
    id: 'independence',
    value: '~%75',
    label: 'Şebeke bağımsızlığı hedefi',
    subtitle: 'Sürdürülebilirlik vizyonu; ürün yol haritası.',
    badge: 'Hedef',
  },
  {
    id: 'roi',
    value: '~4–5 yıl',
    label: 'Pilot amortisman',
    subtitle: `Referans senaryoda simülasyon: ~${CANONICAL_SCENARIO.roiYears.pilot.toLocaleString('tr-TR', { maximumFractionDigits: 1 })} yıl (pilot CAPEX).`,
    badge: 'Simülasyon',
  },
  {
    id: 'daytime',
    value: '%40’a kadar',
    label: 'Gündüz maliyet avantajı',
    subtitle: 'Gündüz tüketim optimizasyonu ve tarife farkından tasarruf potansiyeli.',
    badge: 'Hedef',
  },
  {
    id: 'zero-line',
    value: 'Sıfır ek hat',
    label: 'Mevcut altyapı',
    subtitle: 'Yeni trafo veya hat gerektirmeden overlay kurulum modeli.',
    badge: 'Avantaj',
  },
];

export const IMPACT_FOOTNOTE =
  'Pilot ELYSIUM konfigürasyonunda simülasyon motoru tüketim karşılama oranını ~%37 seviyesinde gösterir (GES+BESS ile karşılanan site tüketimi). %75 şebeke bağımsızlığı ürün hedefidir; yıllık net tasarruf ve ROI rakamları canlı simülatör çıktılarıdır.';

/** ELYSIUM_MODU-GRID.pptx slide 9 — soldan sağa portrait sırası */
export const TEAM = [
  {
    name: 'Tarık Salim KILIÇ',
    role: 'Grup Lideri & Sözcü',
    org: 'Katip Çelebi Üniversitesi',
    bio: 'Ideathon sunumu, proje koordinasyonu ve paydaş iletişimi.',
    initials: 'TK',
    photo: '/team/tarik-kilic.webp',
  },
  {
    name: 'Murat UÇ',
    role: 'Enerji Sistemleri & Entegrasyon',
    org: 'Ege Üniversitesi',
    bio: 'Enerji modeli, peak shaving ve sistem entegrasyonu.',
    initials: 'MU',
    photo: '/team/murat-uc.webp',
  },
  {
    name: 'Mertcan HONÇA',
    role: 'İş Geliştirme & Ürün Stratejisi',
    org: 'Ege Üniversitesi',
    bio: 'İş modeli, fizibilite ve ürün yol haritası.',
    initials: 'MH',
    photo: '/team/mertcan-honca.webp',
  },
  {
    name: 'Yunus Arda GÜNEY',
    role: 'IoT & Donanım',
    org: 'Katip Çelebi Üniversitesi',
    bio: 'Donanım katmanı, platform ve simülasyon arayüzü.',
    initials: 'YG',
    photo: '/team/yunus-guney.webp',
  },
];

export const DEMO_ACCOUNTS = [
  { role: 'Yönetici', username: 'admin', hint: 'Kurumsal panel — tüm modüller' },
  { role: 'Daire sakini', username: 'daire1', hint: 'Kişisel tüketim ve tasarruf görünümü' },
];

export const NAV_SECTIONS = [
  { id: 'hero', label: 'Giriş' },
  { id: 'fark', label: 'Konum' },
  { id: 'problem', label: 'Problem' },
  { id: 'cozum', label: 'Çözüm' },
  { id: 'nasil', label: 'Nasıl' },
  { id: 'pilot', label: 'Pilot' },
  { id: 'etki', label: 'Etki' },
  { id: 'ekip', label: 'Ekip' },
  { id: 'demo', label: 'Demo' },
];

export { CANONICAL_SCENARIO };

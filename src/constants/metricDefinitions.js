/**
 * Simülasyon KPI tanımları — UI ve motor aynı dili kullanır.
 * @see getFinancialMetrics in energyCalculations.js
 */

export const METRIC_COPY = {
  consumptionCoverage: {
    title: 'Tüketim Karşılama',
    unit: '%',
    subtitle: 'Site tüketiminin GES+BESS ile karşılanan payı',
    short: 'tüketim karşılama',
  },
  selfUseOfProduction: {
    title: 'Yerinde Kullanım',
    unit: '%',
    subtitle: 'Üretilen enerjinin şebekeye satılmadan kullanılan payı',
    donutLabel: 'Yerinde Kullanım',
  },
  monthlyNetSavings: {
    title: 'Aylık Net Tasarruf',
    unit: '₺',
    subtitle:
      'Tüm tüketim şebekeden alınsaydı ödenecek tutara göre fark (alış − satış dahil)',
  },
  dailyProduction: {
    subtitle: 'Seçili ay güneş saati × panel gücü',
  },
};

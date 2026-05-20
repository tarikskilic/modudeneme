import { BarChart2, LayoutDashboard, Leaf, TrendingUp, Zap } from 'lucide-react';

export const ADMIN_NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/energy-flow', label: 'Enerji Akışı', icon: Zap, end: false },
  { to: '/admin/financial', label: 'Finansal Simülatör', icon: TrendingUp, end: false },
  { to: '/admin/carbon', label: 'Karbon Paneli', icon: Leaf, end: false },
  { to: '/admin/comparison', label: 'Karşılaştırma', icon: BarChart2, end: false },
];

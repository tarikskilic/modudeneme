import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ADMIN_NAV_ITEMS } from './navItems.js';

function isItemActive(pathname, to, end) {
  if (end) return pathname === to;
  return pathname === to || pathname.startsWith(`${to}/`);
}

export default function Sidebar() {
  const { pathname } = useLocation();

  return (
    <aside
      className="fixed left-0 top-16 z-40 hidden h-[calc(100dvh-4rem)] w-[240px] flex-col border-r border-border bg-card lg:flex"
      aria-label="Yönetici menüsü"
    >
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3">
        {ADMIN_NAV_ITEMS.map(({ to, label, icon: Icon, end }) => {
          const active = isItemActive(pathname, to, end);
          return (
            <Link
              key={to}
              to={to}
              className={[
                'group relative flex items-center gap-3 rounded-r-lg px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted hover:bg-primary/5 hover:text-foreground',
              ].join(' ')}
            >
              {active && (
                <motion.span
                  layoutId="sidebar-active-bar"
                  className="absolute bottom-1 left-0 top-1 w-[3px] rounded-full bg-primary"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}
              <Icon
                className={`h-5 w-5 shrink-0 ${active ? 'text-primary' : ''}`}
                strokeWidth={2}
                aria-hidden
              />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

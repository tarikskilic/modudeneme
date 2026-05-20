import { useEffect, useState } from 'react';
import { LogOut, Menu, RotateCcw, X, Zap } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ADMIN_NAV_ITEMS } from './navItems.js';
import { useSimulation } from '../context/SimulationContext.jsx';
import { signOut } from '../lib/auth.js';

function readAuth() {
  try {
    const raw = localStorage.getItem('auth');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default function Navbar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { reset } = useSimulation();
  const auth = readAuth();
  const role = auth?.role;
  const username = auth?.username ?? '—';
  const isAdmin = role === 'admin';

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [resetPulse, setResetPulse] = useState(0);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawerOpen]);

  const logout = async () => {
    await signOut();
    navigate('/');
  };

  const handleReset = () => {
    reset();
    setResetPulse((n) => n + 1);
  };

  return (
    <>
      <header className="fixed left-0 right-0 top-0 z-50 flex h-16 min-h-[64px] items-center justify-between border-b border-border bg-card px-4 md:px-6">
        <div className="flex min-w-0 items-center gap-2">
          {isAdmin && (
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="touch-target mr-1 inline-flex shrink-0 items-center justify-center rounded-lg border border-border bg-background text-foreground transition hover:border-primary/50 hover:text-primary lg:hidden"
              aria-label="Menüyü aç"
              aria-expanded={drawerOpen}
              aria-controls="admin-mobile-drawer"
            >
              <Menu className="h-5 w-5" strokeWidth={2} aria-hidden />
            </button>
          )}
          <Zap className="h-7 w-7 shrink-0 text-primary" strokeWidth={2} aria-hidden />
          <span className="truncate text-lg font-bold tracking-tight text-foreground">
            MODÜ-GRID
          </span>
        </div>

        <div className="flex min-w-0 items-center gap-2 sm:gap-3 md:gap-4">
          <div className="hidden items-center gap-2 rounded-full border border-border bg-background/70 px-2.5 py-1 text-[11px] sm:inline-flex sm:text-xs">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
            </span>
            <span className="truncate text-muted-light">● Simülasyon Modu</span>
          </div>

          <div className="flex min-w-0 max-w-[38vw] items-center gap-2 sm:max-w-none">
            <span className="hidden truncate text-xs font-medium text-foreground sm:inline sm:text-sm">
              {username}
            </span>
            <motion.span
              layout
              className={`shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold sm:text-xs ${
                isAdmin
                  ? 'bg-primary/20 text-primary'
                  : 'bg-success/20 text-success'
              }`}
            >
              {isAdmin ? 'Yönetici' : 'Daire Sakini'}
            </motion.span>
          </div>

          {isAdmin && (
            <motion.button
              key={resetPulse}
              type="button"
              onClick={handleReset}
              initial={false}
              animate={
                resetPulse > 0
                  ? {
                      rotate: [0, -360],
                      boxShadow: [
                        '0 0 0 rgba(59,130,246,0)',
                        '0 0 18px rgba(59,130,246,0.45)',
                        '0 0 0 rgba(59,130,246,0)',
                      ],
                    }
                  : {}
              }
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="touch-target inline-flex shrink-0 items-center justify-center rounded-lg border border-border bg-background p-2.5 text-foreground transition hover:border-primary/50 hover:text-primary"
              aria-label="Simülasyonu varsayılan değerlere sıfırla"
              title="Simülasyonu sıfırla"
            >
              <RotateCcw className="h-4 w-4" strokeWidth={2} aria-hidden />
            </motion.button>
          )}

          <button
            type="button"
            onClick={logout}
            className="touch-target inline-flex shrink-0 items-center justify-center rounded-lg border border-border bg-background p-2.5 text-foreground transition hover:border-primary/50 hover:text-primary"
            aria-label="Çıkış"
          >
            <LogOut className="h-4 w-4" strokeWidth={2} aria-hidden />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {isAdmin && drawerOpen && (
          <motion.div
            key="drawer-root"
            className="fixed inset-0 z-[60] lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <motion.button
              type="button"
              aria-label="Menüyü kapat"
              onClick={() => setDrawerOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.aside
              id="admin-mobile-drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Yönetici menüsü"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="absolute left-0 top-0 flex h-full w-[280px] max-w-[80vw] flex-col border-r border-border bg-card"
            >
              <div className="flex h-16 items-center justify-between border-b border-border px-4">
                <div className="flex items-center gap-2">
                  <Zap className="h-6 w-6 text-primary" strokeWidth={2} aria-hidden />
                  <span className="text-base font-bold text-foreground">MODÜ-GRID</span>
                </div>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-light transition hover:bg-border hover:text-foreground"
                  aria-label="Menüyü kapat"
                >
                  <X className="h-5 w-5" strokeWidth={2} aria-hidden />
                </button>
              </div>

              <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
                {ADMIN_NAV_ITEMS.map(({ to, label, icon: Icon, end }) => {
                  const active = end
                    ? pathname === to
                    : pathname === to || pathname.startsWith(`${to}/`);
                  return (
                    <Link
                      key={to}
                      to={to}
                      onClick={() => setDrawerOpen(false)}
                      className={[
                        'group relative flex items-center gap-3 rounded-r-lg px-3 py-3 text-sm font-medium transition-colors',
                        active
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-light hover:bg-primary/5 hover:text-foreground',
                      ].join(' ')}
                    >
                      {active && (
                        <span className="absolute bottom-1 left-0 top-1 w-[3px] rounded-full bg-primary" />
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

              <div className="border-t border-border p-3">
                <button
                  type="button"
                  onClick={() => {
                    handleReset();
                    setDrawerOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-medium text-muted-light transition hover:border-primary/50 hover:text-primary"
                >
                  <RotateCcw className="h-4 w-4" strokeWidth={2} aria-hidden />
                  <span>Simülasyonu Sıfırla</span>
                </button>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

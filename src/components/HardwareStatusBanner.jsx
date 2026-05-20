import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RadioTower } from 'lucide-react';

export default function HardwareStatusBanner() {
  const [open, setOpen] = useState(false);
  const closeBtnRef = useRef(null);
  const dialogRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        return;
      }
      if (e.key !== 'Tab' || !dialogRef.current) return;
      const focusables = dialogRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);

    const focusTimer = window.setTimeout(() => closeBtnRef.current?.focus(), 0);

    return () => {
      window.removeEventListener('keydown', onKey);
      window.clearTimeout(focusTimer);
      triggerRef.current?.focus();
    };
  }, [open]);

  return (
    <>
      <div
        className="fixed left-0 right-0 top-16 z-30 flex h-9 min-h-[36px] w-full items-center justify-between gap-2 border-b border-danger/20 px-3 text-[11px] sm:px-6 sm:text-xs lg:left-[240px] lg:w-auto"
        style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
          </span>
          <span className="truncate font-medium text-foreground/95">
            <span className="hidden sm:inline">Donanım Bağlantısı Yok — </span>
            <span>Simülasyon Modu Aktif</span>
          </span>
        </div>
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Saha verilerini topla"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-background/60 px-2 py-1 text-[11px] font-semibold text-foreground ring-1 ring-red-500/25 transition hover:bg-background/90 sm:text-xs"
        >
          <RadioTower className="h-3.5 w-3.5 sm:hidden" strokeWidth={2} aria-hidden />
          <span className="hidden sm:inline">Saha Verilerini Topla</span>
        </button>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="hw-banner-dialog-title"
              className="max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl"
              initial={{ scale: 0.96, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 12 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
            >
              <p id="hw-banner-dialog-title" className="text-sm leading-relaxed text-foreground">
                Donanım bulunamadı. Simülasyon modu devam ediyor.
              </p>
              <div className="mt-6 flex justify-end">
                <button
                  ref={closeBtnRef}
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-card"
                >
                  Kapat
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

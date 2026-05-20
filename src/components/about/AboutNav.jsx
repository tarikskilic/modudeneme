import { useEffect, useRef, useState } from 'react';
import { NAV_SECTIONS } from '../../content/aboutContent.js';

/**
 * @param {object} props
 * @param {Record<string, HTMLElement | null>} props.sectionRefs
 */
export default function AboutNav({ sectionRefs }) {
  const [active, setActive] = useState('hero');
  const didHashScroll = useRef(false);

  useEffect(() => {
    const ids = NAV_SECTIONS.map((s) => s.id);
    const elements = ids.map((id) => sectionRefs[id]).filter(Boolean);
    if (elements.length === 0) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target?.id) {
          setActive(visible[0].target.id);
        }
      },
      { rootMargin: '-20% 0px -55% 0px', threshold: [0.12, 0.35, 0.55] }
    );

    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [sectionRefs]);

  const scrollTo = (id) => {
    const el = sectionRefs[id];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.history.replaceState(null, '', `#${id}`);
    }
  };

  useEffect(() => {
    if (didHashScroll.current) return;
    const hash = window.location.hash.replace('#', '');
    if (hash && sectionRefs[hash]) {
      didHashScroll.current = true;
      requestAnimationFrame(() => scrollTo(hash));
    }
  }, [sectionRefs]);

  return (
    <>
      <nav
        className="sticky top-16 z-40 hidden border-b border-border bg-background/90 backdrop-blur-md lg:block"
        aria-label="Sayfa bölümleri"
      >
        <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 py-2 md:px-6">
          {NAV_SECTIONS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => scrollTo(id)}
              className={[
                'touch-target shrink-0 rounded-lg px-3 py-2 text-xs font-medium transition',
                active === id
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-light hover:bg-border/60 hover:text-foreground',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>
      </nav>

      <div
        className="sticky top-16 z-40 flex gap-2 overflow-x-auto border-b border-border bg-background/95 px-4 py-2 backdrop-blur-md lg:hidden"
        aria-label="Sayfa bölümleri mobil"
      >
        {NAV_SECTIONS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => scrollTo(id)}
            className={[
              'touch-target shrink-0 whitespace-nowrap rounded-full px-3 py-2 text-xs font-medium transition',
              active === id
                ? 'bg-primary text-white'
                : 'border border-border bg-card text-muted-light',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>
    </>
  );
}

import { useEffect, useRef } from 'react';

/**
 * Login.html grid animasyonu — ana/alt grid, kesişim işaretleri, enerji pip'leri.
 */
export default function ElectricGridBackground() {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let W = 0;
    let H = 0;
    const DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const GRID = 56;
    const NODE_COUNT = 9;
    const CONNECT_DIST = 220;
    const nodes = [];

    for (let i = 0; i < NODE_COUNT; i++) {
      nodes.push({
        x: 0,
        y: 0,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        r: 1.6 + Math.random() * 1.2,
        phase: Math.random() * Math.PI * 2,
      });
    }

    const resize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.floor(W * DPR);
      canvas.height = Math.floor(H * DPR);
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

      if (nodes[0].x === 0 && nodes[0].y === 0) {
        for (const n of nodes) {
          n.x = Math.random() * W;
          n.y = Math.random() * H;
        }
      }
    };

    const drawGrid = (t) => {
      const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.7);
      g.addColorStop(0, 'rgba(59,130,246,0.05)');
      g.addColorStop(1, 'rgba(10,15,30,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(59,130,246,0.10)';
      ctx.beginPath();
      const offset = (t * 0.008) % GRID;
      for (let x = -offset; x < W + GRID; x += GRID) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
      }
      for (let y = -offset; y < H + GRID; y += GRID) {
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
      }
      ctx.stroke();

      ctx.strokeStyle = 'rgba(59,130,246,0.04)';
      ctx.beginPath();
      const sub = GRID / 4;
      for (let x = -offset; x < W + GRID; x += sub) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
      }
      for (let y = -offset; y < H + GRID; y += sub) {
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
      }
      ctx.stroke();

      ctx.strokeStyle = 'rgba(59,130,246,0.18)';
      ctx.beginPath();
      for (let x = -offset; x < W + GRID; x += GRID) {
        for (let y = -offset; y < H + GRID; y += GRID) {
          ctx.moveTo(x - 2.5, y);
          ctx.lineTo(x + 2.5, y);
          ctx.moveTo(x, y - 2.5);
          ctx.lineTo(x, y + 2.5);
        }
      }
      ctx.stroke();
    };

    const drawNodes = (t) => {
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d = Math.hypot(dx, dy);
          if (d < CONNECT_DIST) {
            const k = 1 - d / CONNECT_DIST;
            const pulse = 0.5 + 0.5 * Math.sin(t * 0.002 + i + j);
            const alpha = 0.08 + k * 0.45 * (0.6 + 0.4 * pulse);
            ctx.strokeStyle = `rgba(59,130,246,${alpha.toFixed(3)})`;
            ctx.lineWidth = 0.9 + k * 0.8;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();

            if (k > 0.55) {
              const phase = (t * 0.00045 * (i + 1) + i * 0.13) % 1;
              const px = a.x + (b.x - a.x) * phase;
              const py = a.y + (b.y - a.y) * phase;
              ctx.fillStyle = `rgba(147,197,253,${(k * 0.9).toFixed(3)})`;
              ctx.beginPath();
              ctx.arc(px, py, 1.4, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
      }

      for (const n of nodes) {
        const glow = 0.7 + 0.3 * Math.sin(t * 0.003 + n.phase);
        const rg = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, 22);
        rg.addColorStop(0, `rgba(96,165,250,${0.55 * glow})`);
        rg.addColorStop(0.4, `rgba(59,130,246,${0.18 * glow})`);
        rg.addColorStop(1, 'rgba(59,130,246,0)');
        ctx.fillStyle = rg;
        ctx.beginPath();
        ctx.arc(n.x, n.y, 22, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(219,234,254,0.85)';
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const step = (t) => {
      if (document.visibilityState === 'hidden') {
        rafRef.current = 0;
        return;
      }

      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < -20) n.x = W + 20;
        if (n.x > W + 20) n.x = -20;
        if (n.y < -20) n.y = H + 20;
        if (n.y > H + 20) n.y = -20;
      }

      ctx.clearRect(0, 0, W, H);
      drawGrid(t);
      drawNodes(t);
      rafRef.current = requestAnimationFrame(step);
    };

    resize();

    if (reducedMotion) {
      drawGrid(0);
      drawNodes(0);
      window.addEventListener('resize', resize);
      return () => window.removeEventListener('resize', resize);
    }

    rafRef.current = requestAnimationFrame(step);
    window.addEventListener('resize', resize);

    const onVisibility = () => {
      if (document.visibilityState === 'visible' && !rafRef.current) {
        rafRef.current = requestAnimationFrame(step);
      } else if (document.visibilityState === 'hidden') {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return <canvas ref={canvasRef} className="bg-canvas" aria-hidden />;
}

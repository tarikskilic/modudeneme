import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Shield } from 'lucide-react';
import ElectricGridBackground from '../components/ElectricGridBackground';
import { persistAuth, resolveAuth } from '../lib/auth.js';
import '../styles/login.css';

const DEMO_ACCOUNTS = [
  {
    id: 'admin',
    role: 'admin',
    label: 'Yönetici',
    username: 'admin',
    password: 'modigrid2024',
    hint: 'Kurumsal panel',
  },
  {
    id: 'resident',
    role: 'resident',
    label: 'Daire Sakini',
    username: 'daire1',
    password: '1234',
    hint: 'Daire 1 paneli',
  },
];

function pad(n) {
  return String(n).padStart(2, '0');
}

export default function Login() {
  const navigate = useNavigate();
  const [clock, setClock] = useState('--:--:--');
  const [roleTab, setRoleTab] = useState('admin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [capsOn, setCapsOn] = useState(false);
  const [error, setError] = useState('');
  const [hwPhase, setHwPhase] = useState('search');
  const [submitState, setSubmitState] = useState('idle');

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setClock(`${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setHwPhase('failed'), 2200);
    return () => clearTimeout(t);
  }, []);

  const performLogin = useCallback(
    (auth) => {
      setSubmitState('loading');
      setTimeout(() => setSubmitState('success'), 900);
      setTimeout(() => {
        persistAuth(auth.role, auth.username);
        navigate(auth.path);
      }, 1500);
    },
    [navigate]
  );

  const submit = async (e) => {
    e.preventDefault();
    if (submitState !== 'idle') return;

    setError('');
    const auth = await resolveAuth(username, password, roleTab);

    if (!auth) {
      setError('Kullanıcı adı veya şifre hatalı');
      return;
    }

    performLogin(auth);
  };

  const loginWithDemo = async (demo) => {
    if (submitState !== 'idle') return;

    setError('');
    setRoleTab(demo.role);
    setUsername(demo.username);
    setPassword(demo.password);

    const auth = await resolveAuth(demo.username, demo.password, demo.role);
    if (auth) performLogin(auth);
    else setError('Kullanıcı adı veya şifre hatalı');
  };

  const onPwKeyDown = (e) => {
    if (e.getModifierState?.('CapsLock')) setCapsOn(true);
    else setCapsOn(false);
  };

  return (
    <div className="login-page">
      <ElectricGridBackground />
      <div className="vignette" aria-hidden />

      <div className="topbar" aria-hidden>
        <div className="left">
          <span>
            <span className="dot" />
            &nbsp;&nbsp;SYS ONLINE
          </span>
          <span className="sep">/</span>
          <span>{clock}</span>
          <span className="sep">/</span>
          <span>TR/EU-1</span>
        </div>
        <div className="right">
          <span>NODE-0042</span>
          <span className="sep">/</span>
          <span>GRID v1.0</span>
        </div>
      </div>

      <main className="stage">
        <form className="card" onSubmit={submit} autoComplete="off" noValidate>
          <div className="logo">
            <div className="logo-mark" aria-hidden>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
              </svg>
            </div>
            <div className="logo-text">
              <div className="word">
                MODÜ<span className="accent">·</span>GRID
              </div>
              <div className="sub">Akıllı Mikro-Şebeke</div>
            </div>
          </div>

          <div className="divider" />

          <div className="heading">
            <h1>Sisteme Giriş</h1>
            <span className="id">SESSION#A7C2</span>
          </div>

          {error ? <p className="form-error" role="alert">{error}</p> : null}

          <div className="field">
            <label htmlFor="user">Kullanıcı Adı</label>
            <div className="input-wrap">
              <input
                id="user"
                className="input"
                type="text"
                placeholder="ornek.kullanici"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={submitState !== 'idle'}
              />
              <span className="leading" aria-hidden>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21a8 8 0 0 1 16 0" />
                </svg>
              </span>
            </div>
          </div>

          <div className="field">
            <label htmlFor="pw">Şifre</label>
            <div className="input-wrap">
              <input
                id="pw"
                className="input"
                type={showPw ? 'text' : 'password'}
                placeholder="••••••••••"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={onPwKeyDown}
                onBlur={() => setCapsOn(false)}
                disabled={submitState !== 'idle'}
              />
              <span className="leading" aria-hidden>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="4" y="10" width="16" height="11" rx="2" />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                </svg>
              </span>
              <button
                type="button"
                className="toggle-pw"
                onClick={() => setShowPw((s) => !s)}
                aria-label={showPw ? 'Şifreyi gizle' : 'Şifreyi göster'}
                disabled={submitState !== 'idle'}
              >
                {showPw ? <EyeClosedIcon /> : <EyeOpenIcon />}
              </button>
            </div>
            <div className={`hint${capsOn ? ' show' : ''}`} role="status">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 4 4 14h5v6h6v-6h5L12 4z" />
              </svg>
              Caps Lock açık
            </div>
          </div>

          <div className="field">
            <label>Rol Seçimi</label>
            <div className="role-row" role="radiogroup" aria-label="Rol">
              <button
                type="button"
                className="pill"
                aria-pressed={roleTab === 'admin'}
                onClick={() => setRoleTab('admin')}
                disabled={submitState !== 'idle'}
              >
                <Shield strokeWidth={1.8} aria-hidden />
                Yönetici
              </button>
              <button
                type="button"
                className="pill"
                aria-pressed={roleTab === 'resident'}
                onClick={() => setRoleTab('resident')}
                disabled={submitState !== 'idle'}
              >
                <Home strokeWidth={1.8} aria-hidden />
                Daire Sakini
              </button>
            </div>
          </div>

          <div className="demo-block">
            <span className="demo-label">Demo Hesaplar</span>
            <div className="demo-row">
              {DEMO_ACCOUNTS.map((demo) => (
                <button
                  key={demo.id}
                  type="button"
                  className="demo-btn"
                  onClick={() => loginWithDemo(demo)}
                  disabled={submitState !== 'idle'}
                  title={`${demo.username} / ${demo.password}`}
                >
                  <span className="demo-btn-title">{demo.label}</span>
                  <span className="demo-btn-creds">
                    {demo.username}
                    <span className="demo-btn-sep">·</span>
                    {demo.password}
                  </span>
                  <span className="demo-btn-hint">{demo.hint}</span>
                </button>
              ))}
            </div>
          </div>

          <SubmitButton state={submitState} />

          <div className="foot">MODÜ-GRID v1.0 — Akıllı Mikro-Şebeke Yönetim Sistemi</div>

          <div
            className={`status ${hwPhase === 'search' ? 'searching' : 'failed'}`}
            role="status"
            aria-live="polite"
          >
            <span className="status-dot" />
            <span className="label">
              {hwPhase === 'search'
                ? 'Donanım Bağlantısı Aranıyor…'
                : 'Donanım Bulunamadı — Simülasyon Modu Aktif'}
            </span>
            <span className="value">
              <span style={hwPhase === 'failed' ? { color: '#fca5a5' } : undefined}>
                {hwPhase === 'search' ? 'SCAN' : 'SIM'}
              </span>
            </span>
          </div>
        </form>
      </main>

      <div className="corner left" aria-hidden>
        <div className="row">
          <span className="mut">LAT</span> 41.0082°N <span className="mut">/</span> LON 28.9784°E
        </div>
      </div>
      <div className="corner right" aria-hidden>
        <div className="row">
          <span className="mut">UPTIME</span> <span className="ok">99.982%</span>{' '}
          <span className="mut">/</span> 14 NODES
        </div>
      </div>
    </div>
  );
}

function SubmitButton({ state }) {
  if (state === 'loading') {
    return (
      <button type="button" className="submit" disabled>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
          <span className="submit-spinner" />
          Doğrulanıyor…
        </span>
      </button>
    );
  }

  if (state === 'success') {
    return (
      <button type="button" className="submit" disabled>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, color: '#bbf7d0' }}>
          ✓ Yetkilendirildi
        </span>
      </button>
    );
  }

  return (
    <button type="submit" className="submit" id="submitBtn">
      Giriş Yap
      <span className="arrow">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 12h14" />
          <path d="m13 6 6 6-6 6" />
        </svg>
      </span>
    </button>
  );
}

function EyeOpenIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeClosedIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 3l18 18" />
      <path d="M10.6 6.1A10.9 10.9 0 0 1 12 6c6.5 0 10 6 10 6a14.3 14.3 0 0 1-3.2 3.7" />
      <path d="M6.6 6.6A14.3 14.3 0 0 0 2 12s3.5 6 10 6a10.7 10.7 0 0 0 4-.8" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
  );
}
